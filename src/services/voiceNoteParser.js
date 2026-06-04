/* ====================================================================
   Zanji Voice Note → Structured Order Parser (Gemini 2.5 Flash)
   
   This is the AI core of the Zanji Commerce OS voice pipeline.
   It receives a local .ogg audio file path, uploads it to Gemini's
   multimodal Files API, and extracts a clean structured JSON order
   using native responseSchema enforcement (no regex/markdown hacks).
   
   Pipeline:
   ┌─────────────────────────────────────────────────────────────────┐
   │  1. Upload .ogg → Gemini Files API                             │
   │  2. Send file handle + Global System Prompt → gemini-2.5-flash │
   │  3. responseSchema forces deterministic JSON structure          │
   │  4. Delete uploaded file from Gemini (compliance)               │
   │  5. Return parsed order object                                  │
   └─────────────────────────────────────────────────────────────────┘
   
   Supports:
   - Extreme code-switching (Roman Urdu + English, Spanglish, etc.)
   - Unstructured emerging-market addresses (landmarks, market names)
   - Auto country/currency inference from audio context
   ==================================================================== */

const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');

// Initialize the Google Gen AI client with your API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Uploads local audio to Gemini, applies the Global System Prompt, and extracts structured JSON.
 * @param {string} localFilePath - Path to the downloaded .ogg file.
 * @returns {Promise<Object>} Clean, structured JSON matching the international order schema.
 */
async function parseVoiceNoteToOrder(localFilePath) {
    try {
        // Validate the file exists before uploading
        if (!fs.existsSync(localFilePath)) {
            throw new Error(`Audio file not found at path: ${localFilePath}`);
        }

        console.log(`[VoiceNoteParser] 🎙️ Uploading audio to Gemini: ${localFilePath}`);

        // 1. Upload the audio binary file using the Gemini Files API
        const audioFile = await ai.files.upload({
            file: localFilePath,
            config: {
                mimeType: 'audio/ogg'
            }
        });

        console.log(`[VoiceNoteParser] ☁️ File uploaded: ${audioFile.name}`);

        const globalSystemPrompt = `You are a highly advanced multi-lingual data extraction engine for Zanji Commerce OS. Your sole task is to parse this audio file, which frequently contains extreme code-switching (e.g., Roman Urdu/Hindi + English, Spanglish, Arabic + English, Bahasa + English). Extract clean order details including:
1. Country & Currency: Infer from cities, phone numbers, or languages. Map to ISO codes (PK/PKR, ID/IDR, AE/AED, BR/BRL, MX/MXN). Default to "GLOBAL"/"USD" if unclear.
2. Addresses: Extract landmarks, building details, market quarters — consolidate into street_address. Do not discard structural details.
3. Line Items: Extract product names, quantities, and variant notes (color, size, etc.).
4. Customer Details: Extract name and phone if mentioned.
Output JSON strictly matching the requested schema.`;

        // 2. Call the multimodal model with the file handle and instructions
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    fileData: {
                        fileUri: audioFile.uri,
                        mimeType: audioFile.mimeType
                    }
                },
                globalSystemPrompt
            ],
            config: {
                // Force a deterministic JSON object structure without markdown wrappers
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        order_metadata: {
                            type: Type.OBJECT,
                            properties: {
                                detected_country_code: { type: Type.STRING },
                                currency: { type: Type.STRING }
                            },
                            required: ["detected_country_code", "currency"]
                        },
                        customer_details: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, nullable: true },
                                phone: { type: Type.STRING, nullable: true }
                            }
                        },
                        shipping_address: {
                            type: Type.OBJECT,
                            properties: {
                                street_address: { type: Type.STRING },
                                landmark: { type: Type.STRING, nullable: true },
                                city: { type: Type.STRING },
                                postal_code: { type: Type.STRING, nullable: true }
                            },
                            required: ["street_address", "city"]
                        },
                        line_items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    product_name: { type: Type.STRING },
                                    quantity: { type: Type.INTEGER },
                                    variant_notes: { type: Type.STRING, nullable: true }
                                },
                                required: ["product_name", "quantity"]
                            }
                        }
                    },
                    required: ["order_metadata", "shipping_address", "line_items"]
                }
            }
        });

        console.log(`[VoiceNoteParser] 🧠 Gemini response received`);

        // 3. Clean up the uploaded audio file from Gemini servers (compliance)
        try {
            await ai.files.delete({ name: audioFile.name });
            console.log(`[VoiceNoteParser] 🗑️ Uploaded file deleted from Gemini`);
        } catch (cleanupErr) {
            console.warn(`[VoiceNoteParser] ⚠️ File cleanup failed (non-critical): ${cleanupErr.message}`);
        }

        // 4. Parse and return the structured JSON data
        const parsedOrder = JSON.parse(response.text);

        console.log(`[VoiceNoteParser] ✅ Order extracted — ${parsedOrder.line_items?.length || 0} items, Country: ${parsedOrder.order_metadata?.detected_country_code}, City: ${parsedOrder.shipping_address?.city}`);

        return parsedOrder;

    } catch (error) {
        console.error("[VoiceNoteParser] ❌ Gemini AI Parsing Pipeline Failure:", error.message);
        throw new Error("AI core failed to parse mixed-language audio stream.");
    }
}

module.exports = { parseVoiceNoteToOrder };
