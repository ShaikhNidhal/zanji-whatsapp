const http = require('http');

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function runVoicePipelineTest() {
  console.log('========================================================');
  console.log('🔥 STARTING END-TO-END VOICE PIEPLINE INTEGRATION TEST');
  console.log('========================================================\n');

  // Trigger simulated voice message payload:
  // phone_number_id = 100200300400 (org-pk-karachi-001)
  // Sender = 923009999999 (High RTO Risk customer: 4 historical RTOs)
  const webhookPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_PK_001',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { 
            phone_number_id: '100200300400', 
            display_phone_number: '+923001234567' 
          },
          contacts: [{ profile: { name: 'Ayesha Ahmed (High RTO Test)' } }],
          messages: [{
            from: '923009999999',
            id: 'wamid.HBgLOTIzMTU1NTU2Nzg5FQIAERg5MUQwODZDQUJB_MOCK_VOICE',
            timestamp: Math.floor(Date.now() / 1000),
            type: 'audio',
            audio: { 
              id: 'media_id_voice_note_test',
              mime_type: 'audio/ogg'
            }
          }]
        },
        field: 'messages'
      }]
    }]
  };

  console.log('Sending webhook POST payload to /whatsapp/webhook...');
  try {
    const res = await postJson('/whatsapp/webhook', webhookPayload);
    console.log(`Webhook HTTP Status: ${res.status}`);
    console.log(`Webhook HTTP Response: ${res.body}`);
    console.log('\nPipeline running asynchronously in the background.');
    console.log('Wait 10 seconds to allow media download, Gemini parsing, and database persistence...');
    
    await new Promise(r => setTimeout(r, 10000));
    console.log('\n--- Checking Server Logs (Verify step completion) ---');
    console.log('Integration test run complete. Please check the server task output to verify the Gemini response.');
  } catch (err) {
    console.error('Error triggering webhook:', err);
  }
}

runVoicePipelineTest();
