const https = require('https');

/**
 * Sends a structured text message back to the customer via Meta WhatsApp Cloud API.
 * @param {string} phoneNumberId - The merchant's specific registered Meta Phone ID.
 * @param {string} recipientPhone - The customer's WhatsApp number (e.g., "+923001234567").
 * @param {string} messageText - The body content to send.
 */
async function sendWhatsAppMessage(phoneNumberId, recipientPhone, messageText) {
    const META_ACCESS_TOKEN = process.env.META_PERMANENT_ACCESS_TOKEN;
    
    if (!META_ACCESS_TOKEN) {
        console.warn("[WhatsAppMessageService] META_PERMANENT_ACCESS_TOKEN is not set. Simulating sending message...");
        console.log(`[WhatsAppMessageService] (Simulated) To: ${recipientPhone} | Body: ${messageText}`);
        return;
    }

    const cleanPhone = (recipientPhone || '').replace(/[+\s]/g, '');
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const payload = JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { body: messageText }
    });

    const opts = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(url, opts, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`Automated WhatsApp response pushed successfully to: ${recipientPhone}`);
                    resolve(JSON.parse(data));
                } else {
                    console.error(`Meta API Message Dispatch Failure: Status ${res.statusCode}`, data);
                    resolve({ error: true, data });
                }
            });
        });

        req.on('error', (err) => {
            console.error("Meta API Connection error:", err.message);
            resolve({ error: true, message: err.message });
        });

        req.write(payload);
        req.end();
    });
}

module.exports = { sendWhatsAppMessage };
