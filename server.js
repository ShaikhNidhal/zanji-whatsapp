/* ====================================================================
   ZANJI METRIC API Webhook Gateway & SSE Broadcast Server (Zero-Dependency)
   ==================================================================== */

// Inject permanent Gemini API Key before loading dependencies
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBsLx-5V5VTTzam_wRv4Jwr8hIgI8c8mzY';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Custom integrations for pay splitting, shipping markup, and RTO risk check
const { processSplitPayment } = require('./src/services/payService');
const { calculateShippingRate } = require('./src/services/shippingService');
const { assessOrderRisk } = require('./src/middleware/rtoShield');
const webhookRouter = require('./src/routes/webhookRouter');
const { initSocketServer } = require('./src/services/socketService');
const { keepZanjiEngineAlive } = require('./src/services/keepAliveService');

const PORT = process.env.PORT || 3000;

// Config file path for persistent settings
const CONFIG_PATH = path.join(__dirname, 'waba_config.json');

// In-Memory cache for configurations & SSE clients
let wabaConfig = {
  wabaId: "",
  phoneId: "",
  accessToken: "",
  verifyToken: "merchant_secret_token",
  status: "sandbox", // 'sandbox' | 'live' | 'disconnected'
  subscription: "free" // 'free' | 'pro' | 'enterprise'
};

// Load saved config if exists
if (fs.existsSync(CONFIG_PATH)) {
  try {
    wabaConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    console.log('[Zanji Server] WABA Config loaded from disk:', wabaConfig.status);
  } catch (e) {
    console.error('[Zanji Server] Error parsing config, using defaults:', e);
  }
}

// Active Server-Sent Events (SSE) browser client connections
let sseClients = [];

// Helper to send json responses
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper to broadcast events to all active dashboard pages
function broadcastToClients(eventType, eventData) {
  console.log(`[Zanji Server] Broadcasting ${eventType} to ${sseClients.length} clients`);
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(eventData)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (e) {
      console.warn('[Zanji Server] Failed to write to client socket, removing');
    }
  });
}

// Register pipeline listener to broadcast async events to dashboard
webhookRouter.registerPipelineListener((eventType, data) => {
  broadcastToClients(eventType, data);
});


// Main HTTP Server Request Router
const server = http.createServer((req, res) => {
  // CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const currentUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = currentUrl.pathname;
  const q = Object.fromEntries(currentUrl.searchParams.entries());
  // Health check endpoint (Used by keep-alive worker and uptime monitors)
  if (req.method === 'GET' && pathname === '/health') {
    sendJSON(res, 200, { status: "UP", timestamp: new Date() });
    return;
  }

  // 1. Multi-Tenant Meta API Webhook Verification (GET)
  //    Supports both /webhook (legacy) and /whatsapp/webhook (canonical)
  if (req.method === 'GET' && (pathname === '/webhook' || pathname === '/whatsapp/webhook')) {
    console.log(`[Zanji Gateway] 🔐 Incoming verify request on ${pathname}`);

    webhookRouter.verifyWebhook(q)
      .then(result => {
        if (result.isPlainText) {
          res.writeHead(result.status, { 'Content-Type': 'text/plain' });
          res.end(String(result.body));
        } else {
          sendJSON(res, result.status, result.body);
        }
      })
      .catch(err => {
        console.error('[Zanji Gateway] Verify error:', err);
        sendJSON(res, 500, { error: 'Internal server error during verification' });
      });
    return;
  }

  // 2. Multi-Tenant Meta API Webhook Payload Router (POST)
  //    Resolves phone_number_id → organization_id for strict data isolation
  if (req.method === 'POST' && (pathname === '/webhook' || pathname === '/whatsapp/webhook')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        console.log('[Zanji Gateway] 📨 Incoming webhook payload from Meta API');

        // Multi-tenant routing engine
        const result = await webhookRouter.handleIncoming(payload);

        // If a message was extracted AND a merchant was resolved, broadcast it
        if (result.merchantContext && result.messageData) {
          // Inject merchant context into the event for the dashboard
          const enrichedEvent = {
            ...result.messageData,
            merchantContext: {
              organizationId: result.merchantContext.organizationId,
              displayPhone: result.merchantContext.displayPhone
            }
          };

          broadcastToClients('whatsapp_incoming', enrichedEvent);
          console.log(`[Zanji Gateway] ✅ Dispatched to ${sseClients.length} dashboard clients for org: ${result.merchantContext.organizationId}`);
        }

        // If a status update came in, broadcast as a separate event
        if (result.merchantContext && result.statusUpdate) {
          broadcastToClients('whatsapp_status', {
            ...result.statusUpdate,
            organizationId: result.merchantContext.organizationId
          });
        }

        sendJSON(res, result.status, result.body);
      } catch (err) {
        console.error('[Zanji Gateway] Webhook payload parse error:', err);
        sendJSON(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // 2.5 Admin: List registered multi-tenant merchants (GET)
  if (req.method === 'GET' && pathname === '/api/merchants') {
    webhookRouter.listRegisteredMerchants()
      .then(merchants => sendJSON(res, 200, { merchants }))
      .catch(err => sendJSON(res, 500, { error: err.message }));
    return;
  }

  // 3. Server-Sent Events (SSE) Client Channel (GET)
  if (req.method === 'GET' && pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial configuration handshake
    res.write(`event: config_sync\ndata: ${JSON.stringify(wabaConfig)}\n\n`);
    
    // Register active client connection
    sseClients.push(res);
    console.log(`[Zanji Server] Dashboard UI client connected. Total clients: ${sseClients.length}`);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
      console.log(`[Zanji Server] Dashboard UI client disconnected. Remaining: ${sseClients.length}`);
    });
    return;
  }

  // 4. Update settings API endpoint (POST)
  if (req.method === 'POST' && pathname === '/api/settings') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        
        // Merge configuration settings
        wabaConfig = { ...wabaConfig, ...update };
        
        // Persist to disk
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(wabaConfig, null, 2));
        console.log('[Zanji Server] Configuration updated & saved:', wabaConfig);

        // Sync change with all connected UI windows
        broadcastToClients('config_sync', wabaConfig);

        sendJSON(res, 200, { success: true, config: wabaConfig });
      } catch (err) {
        sendJSON(res, 400, { error: 'Failed to update settings' });
      }
    });
    return;
  }

  // 5. Proxy outgoing Meta WABA send messages endpoint (POST)
  if (req.method === 'POST' && pathname === '/api/send-message') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('[Zanji Server] Outgoing message request via Proxy:', data);

        // check subscription limits (starter limit validation)
        if (wabaConfig.subscription === 'free' && data.isBroadcast) {
          sendJSON(res, 403, { 
            success: false, 
            error: "Starter tier limit reached! Please upgrade your Zanji subscription to send bulk Broadcast Campaigns." 
          });
          return;
        }

        // Mock Meta connection details if parameters are not complete
        if (!wabaConfig.phoneId || !wabaConfig.accessToken) {
          console.log('[Zanji Server] No credentials saved. Simulating sending message...');
          sendJSON(res, 200, { 
            success: true, 
            mode: "mocked_sandbox", 
            message: "Credentials missing. Message simulated successfully in UI." 
          });
          return;
        }

        // Prepare raw Meta Cloud API outbound payload
        const metaUrl = `https://graph.facebook.com/v20.0/${wabaConfig.phoneId}/messages`;
        let payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: data.to.replace(/[+\s]/g, '') // Remove + and spaces
        };

        if (data.template) {
          payload.type = "template";
          payload.template = {
            name: data.template,
            language: { code: data.langCode || "ur" }
          };
        } else {
          payload.type = "text";
          payload.text = { body: data.text };
        }

        console.log(`[Zanji Server] Forwarding payload to Meta WABA Graph API: ${metaUrl}`);

        // Native https request to Meta API (zero-dependency)
        const https = require('https');
        const reqOpts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wabaConfig.accessToken}`
          }
        };

        const metaReq = https.request(metaUrl, reqOpts, (metaRes) => {
          let resBody = '';
          metaRes.on('data', chunk => { resBody += chunk; });
          metaRes.on('end', () => {
            console.log(`[Zanji Server] Meta API responded with status: ${metaRes.statusCode}`);
            const responseData = JSON.parse(resBody);
            
            if (metaRes.statusCode >= 200 && metaRes.statusCode < 300) {
              sendJSON(res, 200, { success: true, metaResponse: responseData });
            } else {
              sendJSON(res, metaRes.statusCode, { success: false, error: responseData.error ? responseData.error.message : 'Meta API Error' });
            }
          });
        });

        metaReq.on('error', (e) => {
          console.error('[Zanji Server] https connection error to Meta Graph:', e);
          sendJSON(res, 500, { success: false, error: "Connection to Meta Graph API failed." });
        });

        metaReq.write(JSON.stringify(payload));
        metaReq.end();

      } catch (err) {
        sendJSON(res, 500, { error: 'Outbound dispatch failed' });
      }
    });
    return;
  }

  // 6. Mock endpoint to trigger simulated incoming Meta webhook payloads
  if (req.method === 'POST' && pathname === '/api/simulate-incoming') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        console.log('[Zanji Server] Simulated incoming Meta webhook trigger:', eventData);

        // Forward to the listener format
        const mockWebhook = {
          object: "whatsapp_business_account",
          entry: [{
            id: wabaConfig.wabaId || "123456789",
            changes: [{
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "923001234567", phone_number_id: wabaConfig.phoneId || "999" },
                contacts: [{ profile: { name: eventData.name || "Ayesha Ahmed" }, wa_id: eventData.phone.replace(/[+\s]/g, '') }],
                messages: [{
                  from: eventData.phone.replace(/[+\s]/g, ''),
                  id: "wamid.HBgLOTIzMTU1NTU2Nzg5FQIAERg5MUQwODZDQUJB",
                  timestamp: Math.floor(Date.now() / 1000),
                  text: eventData.text ? { body: eventData.text } : undefined,
                  type: eventData.type || "text",
                  audio: eventData.type === 'audio' ? { id: "media_id_voice_note" } : undefined,
                  referral: eventData.referral ? {
                    source_type: eventData.referral.sourceType,
                    source_id: eventData.referral.sourceId,
                    source_url: eventData.referral.sourceUrl,
                    headline: eventData.referral.headline,
                    body: eventData.referral.body,
                    image_url: eventData.referral.mediaUrl,
                    campaign_name: eventData.referral.campaignName,
                    voucher_code: eventData.referral.voucherCode
                  } : undefined
                }]
              },
              field: "messages"
            }]
          }]
        };

        // Forward to our POST webhook endpoint directly via code routing
        const payloadStr = JSON.stringify(mockWebhook);
        broadcastToClients('whatsapp_incoming', {
          sender: 'customer',
          phone: eventData.phone,
          name: eventData.name || "Ayesha Ahmed",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: eventData.type || 'text',
          text: eventData.text || (eventData.type === 'audio' ? "[Urdu Voice Message] Click to process transcription." : ""),
          isVoice: eventData.type === 'audio',
          referral: eventData.referral || undefined
        });

        sendJSON(res, 200, { success: true });
      } catch (err) {
        sendJSON(res, 400, { error: 'Failed to simulate hook event' });
      }
    });
    return;
  }

  // 7. Fintech split payment callback webhook (POST)
  if (req.method === 'POST' && pathname === '/api/pay/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const result = processSplitPayment(payload);
        sendJSON(res, result.success ? 200 : 400, result);
      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // 8. Logistics shipping rate pricing calculator (POST)
  if (req.method === 'POST' && pathname === '/api/shipping/calculate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { countryCode, weightKg } = payload;
        const result = calculateShippingRate(countryCode, weightKg);
        sendJSON(res, 200, result);
      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // 9. Antigravity RTO Shield risk analyzer (POST)
  if (req.method === 'POST' && pathname === '/api/rto/check') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const buyerPhone = payload.buyer_phone || payload.phone || '';
        const shippingAddress = { street_address: payload.address || '' };
        const result = await assessOrderRisk(buyerPhone, shippingAddress);
        sendJSON(res, 200, result);
      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Launch server listener with WebSockets enabled
const io = initSocketServer(server);

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 [Zanji Gateway Server] Running live on port ${PORT}`);
  console.log(`👉 Webhook verify endpoint: http://localhost:${PORT}/webhook`);
  console.log(`👉 Client events listener:   http://localhost:${PORT}/events`);
  console.log(`=============================================================\n`);

  // Initialize Render free-tier keep-alive worker
  const renderAppUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  keepZanjiEngineAlive(renderAppUrl);
});
