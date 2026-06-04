// Multi-Tenant Gateway Simulation Tests
const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================================');
  console.log('  ZANJI MULTI-TENANT GATEWAY SIMULATION TESTS');
  console.log('========================================================\n');

  // TEST 1: Verify — Pakistan merchant (should return challenge)
  console.log('--- TEST 1: GET /whatsapp/webhook — Pakistan merchant verify ---');
  let r = await request('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=merchant_secret_token&hub.challenge=CHALLENGE_PK_OK');
  console.log(`Status: ${r.status} | Body: ${r.body}`);
  console.log(r.status === 200 && r.body === 'CHALLENGE_PK_OK' ? '✅ PASS\n' : '❌ FAIL\n');

  // TEST 2: Verify — Dubai merchant (different token)
  console.log('--- TEST 2: GET /whatsapp/webhook — Dubai merchant verify ---');
  r = await request('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=dubai_merchant_token&hub.challenge=CHALLENGE_AE_OK');
  console.log(`Status: ${r.status} | Body: ${r.body}`);
  console.log(r.status === 200 && r.body === 'CHALLENGE_AE_OK' ? '✅ PASS\n' : '❌ FAIL\n');

  // TEST 3: Verify — Jakarta merchant
  console.log('--- TEST 3: GET /whatsapp/webhook — Jakarta merchant verify ---');
  r = await request('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=jakarta_merchant_token&hub.challenge=CHALLENGE_ID_OK');
  console.log(`Status: ${r.status} | Body: ${r.body}`);
  console.log(r.status === 200 && r.body === 'CHALLENGE_ID_OK' ? '✅ PASS\n' : '❌ FAIL\n');

  // TEST 4: Verify — Unknown token (should 403)
  console.log('--- TEST 4: GET /whatsapp/webhook — UNKNOWN token (expect 403) ---');
  r = await request('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=FAKE_TOKEN&hub.challenge=nope');
  console.log(`Status: ${r.status} | Body: ${r.body}`);
  console.log(r.status === 403 ? '✅ PASS\n' : '❌ FAIL\n');

  // TEST 5: POST — Pakistan merchant message (phone_number_id = 100200300400)
  console.log('--- TEST 5: POST /whatsapp/webhook — Pakistan merchant incoming ---');
  r = await request('POST', '/whatsapp/webhook', {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_PK_001',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: '100200300400', display_phone_number: '+923001234567' },
          contacts: [{ profile: { name: 'Ahmed Khan' } }],
          messages: [{
            from: '923009876543',
            type: 'text',
            text: { body: 'Bhai, 2 shirts chahiye red color mein, COD karein Lahore' }
          }]
        },
        field: 'messages'
      }]
    }]
  });
  const r5 = JSON.parse(r.body);
  console.log(`Status: ${r.status} | Org: ${r5.organization || 'N/A'}`);
  console.log(r.status === 200 && r5.organization === 'org-pk-karachi-001' ? '✅ PASS — Routed to Pakistan org\n' : '❌ FAIL\n');

  // TEST 6: POST — Dubai merchant message (phone_number_id = 500600700800)
  console.log('--- TEST 6: POST /whatsapp/webhook — Dubai merchant incoming ---');
  r = await request('POST', '/whatsapp/webhook', {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_AE_001',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: '500600700800', display_phone_number: '+971501234567' },
          contacts: [{ profile: { name: 'Fatima Al-Rashid' } }],
          messages: [{
            from: '971509876543',
            type: 'text',
            text: { body: 'I want 3 abayas, black, deliver to Dubai Marina' }
          }]
        },
        field: 'messages'
      }]
    }]
  });
  const r6 = JSON.parse(r.body);
  console.log(`Status: ${r.status} | Org: ${r6.organization || 'N/A'}`);
  console.log(r.status === 200 && r6.organization === 'org-ae-dubai-001' ? '✅ PASS — Routed to Dubai org\n' : '❌ FAIL\n');

  // TEST 7: POST — UNREGISTERED phone_number_id (should 404)
  console.log('--- TEST 7: POST /whatsapp/webhook — UNKNOWN phone (expect 404) ---');
  r = await request('POST', '/whatsapp/webhook', {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_UNKNOWN',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: 'DOES_NOT_EXIST_999' },
          contacts: [{ profile: { name: 'Ghost User' } }],
          messages: [{
            from: '15551234567',
            type: 'text',
            text: { body: 'Hello from nowhere' }
          }]
        },
        field: 'messages'
      }]
    }]
  });
  console.log(`Status: ${r.status} | Body: ${r.body}`);
  console.log(r.status === 404 ? '✅ PASS — Unregistered phone correctly rejected\n' : '❌ FAIL\n');

  // TEST 8: GET /api/merchants — List all registered merchants
  console.log('--- TEST 8: GET /api/merchants — List registered merchants ---');
  r = await request('GET', '/api/merchants');
  const r8 = JSON.parse(r.body);
  console.log(`Status: ${r.status} | Merchants count: ${r8.merchants?.length}`);
  r8.merchants?.forEach(m => console.log(`  → ${m.organization_id} | ${m.display_phone_number} | ${m.waba_id}`));
  console.log(r.status === 200 && r8.merchants?.length === 3 ? '✅ PASS\n' : '❌ FAIL\n');

  // TEST 9: Legacy path — POST /webhook (backwards compatibility)
  console.log('--- TEST 9: POST /webhook (legacy path) — Jakarta merchant ---');
  r = await request('POST', '/webhook', {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_ID_001',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: '900100200300', display_phone_number: '+628123456789' },
          contacts: [{ profile: { name: 'Budi Santoso' } }],
          messages: [{
            from: '628198765432',
            type: 'text',
            text: { body: 'Mau pesan 5 hijab, kirim ke Jakarta Selatan ya kak' }
          }]
        },
        field: 'messages'
      }]
    }]
  });
  const r9 = JSON.parse(r.body);
  console.log(`Status: ${r.status} | Org: ${r9.organization || 'N/A'}`);
  console.log(r.status === 200 && r9.organization === 'org-id-jakarta-001' ? '✅ PASS — Legacy path routes correctly\n' : '❌ FAIL\n');

  console.log('========================================================');
  console.log('  ALL MULTI-TENANT GATEWAY TESTS COMPLETE');
  console.log('========================================================\n');
}

runTests().catch(console.error);
