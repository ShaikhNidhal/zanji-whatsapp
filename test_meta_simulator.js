const axios = require('axios');

// Configure the address of your running application server
const LOCAL_SERVER_URL = 'http://localhost:3000/whatsapp/webhook';

/**
 * Simulates an incoming customer voice note event coming from Meta's infrastructure.
 */
async function simulateCustomerVoiceNote() {
    console.log("🚀 Initializing End-to-End Simulation Pipeline for Zanji OS...");

    // Mock incoming JSON data structure sent by Meta's webhook system
    const mockMetaWebhookPayload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "WABA_MOCK_ID_99",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: {
                        display_phone_number: "+923001112233",
                        phone_number_id: "MOCK_PHONE_NUMBER_ID_XYZ" // Matches your DB tenant profile
                    },
                    contacts: [{ profile: { name: 'Ayesha Ahmed' } }],
                    messages: [{
                        from: "923334445556", // Customer's simulated WhatsApp number
                        id: "ABGGWGFG_MOCK_MEDIA_MSG_ID",
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        type: "audio",
                        audio: {
                            mime_type: "audio/ogg",
                            id: "MOCK_MEDIA_ID_12345" // Triggers the Audio Downloader
                        }
                    }]
                },
                field: "messages"
            }]
        }]
    };

    try {
        console.log("📥 Injection: Sending mock customer voice note payload to entry point gateway...");
        
        const response = await axios.post(LOCAL_SERVER_URL, mockMetaWebhookPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`📡 Server Gateway Status Response: ${response.status} - ${JSON.stringify(response.data)}`);
        console.log("\n🔍 Verification Steps to check in your main server terminal logs:");
        console.log("1. Verify that 'MOCK_PHONE_NUMBER_ID_XYZ' matches a registered tenant organization.");
        console.log("2. Check that the file download component requested media ID: MOCK_MEDIA_ID_12345");
        console.log("3. Ensure the Gemini AI parsed items, addresses, and languages successfully.");
        console.log("4. Verify that the Antigravity Shield correctly flagged the customer's phone history.");
        console.log("5. Ensure the final record saved to the database and broadcasted via WebSockets.");
        console.log("\n🎉 Simulation complete! If the server logs look correct, your system is ready for production.");

    } catch (error) {
        console.error("❌ Simulation Failed:", error.response ? error.response.data : error.message);
    }
}

// Execute the simulation script
simulateCustomerVoiceNote();
