/* ====================================================================
   Zanji Multi-Tenant WhatsApp Webhook Router
   
   This module provides the MASTER GATEWAY logic for routing incoming
   Meta WhatsApp webhooks to the correct merchant organization using
   phone_number_id → organization_id database lookups.
   
   Architecture:
   ┌──────────────────────────────────────────────────────────────┐
   │  Meta Cloud API                                              │
   │  POST → /whatsapp/webhook  (all merchants share one URL)     │
   └───────────────┬──────────────────────────────────────────────┘
                   │
   ┌───────────────▼──────────────────────────────────────────────┐
   │  webhookRouter.verifyWebhook(req)                            │
   │  → DB lookup: webhook_verify_token → merchant match          │
   │  webhookRouter.handleIncoming(req)                           │
   │  → DB lookup: phone_number_id → organization_id              │
   │  → Route message to correct merchant's processing pipeline   │
   └──────────────────────────────────────────────────────────────┘
   
   Adapted for Zanji's zero-dependency Node.js HTTP server.
   ==================================================================== */

const pool = require('../db');
const fs = require('fs');
const { downloadWhatsAppAudio } = require('../services/mediaDownloader');
const { parseVoiceNoteToOrder } = require('../services/voiceNoteParser');
const { saveParsedOrderToDatabase } = require('../services/orderPersistence');
const { assessOrderRisk } = require('../middleware/rtoShield');
const { broadcastLiveOrderUpdate } = require('../services/socketService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { assignOperatorRoundRobin } = require('../services/roundRobinService');

// Async pipeline callback listener for Server-Sent Events integration
let onAsyncPipelineUpdate = null;

function registerPipelineListener(listener) {
  onAsyncPipelineUpdate = listener;
}

// ── GET /whatsapp/webhook ─────────────────────────────────────────────
// Meta Webhook Verification (Required by Facebook to activate connection)
// Instead of checking a single static token, we query the database to
// find which merchant is trying to onboard.

async function verifyWebhook(queryParams) {
  const mode = queryParams['hub.mode'];
  const token = queryParams['hub.verify_token'];
  const challenge = queryParams['hub.challenge'];

  if (!mode || !token) {
    return { status: 403, body: { error: 'Missing mode or token' } };
  }

  // Multi-tenant: check if this verify token belongs to ANY onboarded merchant
  const result = await pool.query(
    'SELECT id, organization_id FROM merchant_whatsapp_settings WHERE webhook_verify_token = $1',
    [token]
  );

  if (result.rows.length > 0) {
    console.log(`[Multi-Tenant Gateway] ✅ Webhook verified for org: ${result.rows[0].organization_id}`);
    return { status: 200, body: challenge, isPlainText: true };
  }

  console.warn(`[Multi-Tenant Gateway] ❌ Verification failed — no merchant found for token: ${token}`);
  return { status: 403, body: { error: 'Verification failed. Token not recognized.' } };
}

// ── POST /whatsapp/webhook ────────────────────────────────────────────
// Master incoming message handler. Resolves the merchant from the payload's
// phone_number_id and injects organization context before processing.

async function handleIncoming(payload) {
  // WhatsApp webhook payload structure:
  // payload.entry[0].changes[0].value.metadata.phone_number_id
  
  if (!payload || !payload.entry || !payload.entry[0]) {
    console.warn('[Multi-Tenant Gateway] ⚠️ Malformed payload — no entry array');
    return {
      status: 400,
      body: { error: 'Malformed webhook payload' },
      merchantContext: null
    };
  }

  const entry = payload.entry[0];
  
  if (!entry.changes || !entry.changes[0] || !entry.changes[0].value) {
    console.warn('[Multi-Tenant Gateway] ⚠️ Payload has no changes array');
    return {
      status: 200,
      body: { success: true, message: 'Acknowledged (no processable changes)' },
      merchantContext: null
    };
  }

  const changeValue = entry.changes[0].value;
  const phoneNumberId = changeValue.metadata?.phone_number_id;

  if (!phoneNumberId) {
    console.warn('[Multi-Tenant Gateway] ⚠️ No phone_number_id in metadata');
    return {
      status: 200,
      body: { success: true, message: 'Acknowledged (no phone_number_id)' },
      merchantContext: null
    };
  }

  // ── CRITICAL: Multi-tenant database lookup ──────────────────────────
  // This is the core isolation mechanism. Every incoming message is
  // mapped to its owning organization via the phone_number_id.
  
  const merchantLookup = await pool.query(
    'SELECT organization_id, waba_id, display_phone_number FROM merchant_whatsapp_settings WHERE phone_number_id = $1',
    [phoneNumberId]
  );

  if (merchantLookup.rows.length === 0) {
    console.error(`[Multi-Tenant Gateway] 🚨 UNREGISTERED phone_number_id: ${phoneNumberId}`);
    console.error('[Multi-Tenant Gateway] This phone number is not mapped to any merchant.');
    return {
      status: 404,
      body: { error: 'Phone number not registered. Merchant not found.' },
      merchantContext: null
    };
  }

  const merchant = merchantLookup.rows[0];
  
  console.log(`[Multi-Tenant Gateway] ✅ Message routed to org: ${merchant.organization_id}`);
  console.log(`[Multi-Tenant Gateway]    WABA: ${merchant.waba_id}`);
  console.log(`[Multi-Tenant Gateway]    Phone: ${merchant.display_phone_number}`);

  // ── Build the merchant-scoped context ───────────────────────────────
  // This context object is injected into every downstream handler so that
  // order creation, RTO checks, and broadcasts are all org-isolated.

  const merchantContext = {
    organizationId: merchant.organization_id,
    wabaId: merchant.waba_id,
    displayPhone: merchant.display_phone_number,
    phoneNumberId: phoneNumberId,
    resolvedAt: new Date().toISOString()
  };

  // ── Extract message data ────────────────────────────────────────────
  let messageData = null;

  if (changeValue.messages && changeValue.messages[0]) {
    const msg = changeValue.messages[0];
    const senderName = changeValue.contacts?.[0]?.profile?.name || 'Unknown Customer';
    const senderPhone = msg.from;

    messageData = {
      sender: 'customer',
      phone: `+${senderPhone}`,
      name: senderName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: msg.type, // 'text' | 'audio' | 'interactive'
      rawMessage: msg
    };

    if (msg.type === 'text') {
      messageData.text = msg.text.body;
    } else if (msg.type === 'audio') {
      messageData.text = '[Voice Message] Processing transcription...';
      messageData.mediaId = msg.audio.id;
      messageData.isVoice = true;
    } else if (msg.type === 'interactive') {
      messageData.text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive]';
      messageData.buttonId = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id;
    } else if (msg.type === 'image') {
      messageData.text = msg.image?.caption || '[Image received]';
      messageData.mediaId = msg.image?.id;
      messageData.isMedia = true;
    } else if (msg.type === 'document') {
      messageData.text = msg.document?.caption || `[Document: ${msg.document?.filename || 'file'}]`;
      messageData.mediaId = msg.document?.id;
      messageData.isMedia = true;
    } else if (msg.type === 'location') {
      messageData.text = `📍 Location: ${msg.location?.latitude}, ${msg.location?.longitude}`;
      messageData.location = msg.location;
    }

    // Parse CTWA Ad Referral details if present
    if (msg.referral) {
      messageData.referral = {
        sourceType: msg.referral.source_type,
        sourceId: msg.referral.source_id,
        sourceUrl: msg.referral.source_url,
        headline: msg.referral.headline,
        body: msg.referral.body,
        mediaUrl: msg.referral.image_url || msg.referral.video_url || null,
        campaignName: msg.referral.campaign_name || null,
        voucherCode: msg.referral.voucher_code || null
      };
    }

    // ── Audio Download Pipeline ─────────────────────────────────────
    // When the incoming message is a voice note, trigger the async
    // multi-tenant download pipeline to fetch the .ogg from Meta and
    // save it into /storage/tenant_{organizationId}/
    if (msg.type === 'audio') {
      const audioPayload = msg.audio;
      const mediaId = audioPayload.id;

      console.log(`[Multi-Tenant Gateway] 🎙️ Processing incoming audio file [${mediaId}] for Organization: ${merchantContext.organizationId}`);

      // Trigger asynchronous multi-tenant download → parse pipeline
      downloadWhatsAppAudio(mediaId, merchantContext.organizationId)
        .then(async (savedPath) => {
          // 1. Convert audio stream straight into clean structured JSON (Core AI extraction)
          const extractedOrderJson = await parseVoiceNoteToOrder(savedPath);
          
          // 2. NEW: Calculate Antigravity Shield Risk Profile
          const buyerPhone = extractedOrderJson.customer_details?.phone || messageData.phone;
          const dbRiskResult = await assessOrderRisk(buyerPhone, extractedOrderJson.shipping_address || {});
          
          // Append the risk profile into the primary metadata payload
          extractedOrderJson.risk_assessment = dbRiskResult;

          // 3. Persistent storage execution
          const savedRecord = await saveParsedOrderToDatabase(extractedOrderJson, merchantContext.organizationId);
          console.log(`Order pipeline finalized. Persistent Database ID: ${savedRecord.id}`);

          // 4. NEW: Automated Risk Mitigation Interception
          if (dbRiskResult.risk_tier === 'RED') {
              const warningMessage = `⚠️ Order Verification Required:\n\nWe noticed your shipping address is incomplete or our system requires verification for Cash on Delivery. To confirm your order, please reply directly to this message sharing your exact GPS Location pin.`;
              
              // Execute the automated message back to the buyer instantly
              await sendWhatsAppMessage(merchantContext.phoneNumberId, buyerPhone, warningMessage);
          }

          // 5. NEW: Smart Round-Robin Allocation Engine
          const assignedAgentId = await assignOperatorRoundRobin(merchantContext.organizationId);
          
          // If an operator is online, update the order assignment field in the database
          if (assignedAgentId) {
              await pool.query('UPDATE orders SET created_by_user_id = $1 WHERE id = $2', [assignedAgentId, savedRecord.id]);
          }

          // 6. Real-time Multi-User UI dashboard dispatching (Includes assigned agent payload)
          broadcastLiveOrderUpdate(merchantContext.organizationId, {
              order_id: savedRecord.id,
              assigned_operator_id: assignedAgentId || 'UNASSIGNED',
              extracted_data: extractedOrderJson
          });

          // Map database risk result to UI presentation schema for SSE compatibility
          const riskResult = {
            riskTier: dbRiskResult.risk_tier.charAt(0) + dbRiskResult.risk_tier.slice(1).toLowerCase(), // 'Red', 'Yellow', 'Green'
            reasons: [],
            actionRequired: dbRiskResult.system_action === 'REQUIRE_PREPAYMENT_OR_GPS',
            alertMessage: null,
            depositLink: `https://zanji.shop/pay/deposit?phone=${encodeURIComponent(buyerPhone)}`
          };
          
          if (dbRiskResult.historical_rto_count > 0) {
            riskResult.reasons.push(`High RTO history (${dbRiskResult.historical_rto_count} items returned)`);
          }
          if (dbRiskResult.address_flag === 'INCOMPLETE') {
            riskResult.reasons.push(`Incomplete address check`);
          }
          if (riskResult.riskTier === 'Red') {
            riskResult.alertMessage = `⚠️ Order Verification Required:\n\nWe noticed your shipping address is incomplete or our system requires verification for Cash on Delivery. To confirm your order, please reply directly to this message sharing your exact GPS Location pin.`;
          }
          
          console.log(`[Multi-Tenant Gateway] 🛡️ Antigravity Shield Risk Assessment for ${buyerPhone}:`, riskResult);

          // Broadcast pipeline completion event with extracted data and risk details
          if (onAsyncPipelineUpdate) {
            onAsyncPipelineUpdate('whatsapp_pipeline_complete', {
              organizationId: merchantContext.organizationId,
              orderId: savedRecord.id,
              order: savedRecord,
              extracted: extractedOrderJson,
              risk: riskResult,
              phone: buyerPhone,
              name: messageData.name,
              assignedOperatorId: assignedAgentId || 'UNASSIGNED'
            });
          }

          // Clean up the disk file safely
          fs.unlinkSync(savedPath); 
        })
        .catch((err) => {
          console.error(`Fatal Pipeline Breakdown:`, err);
        });
    }
  }

  // ── Status updates (message delivered, read receipts, etc.) ─────────
  let statusUpdate = null;
  if (changeValue.statuses && changeValue.statuses[0]) {
    statusUpdate = changeValue.statuses[0];
    console.log(`[Multi-Tenant Gateway] 📨 Status update for ${merchant.organization_id}: ${statusUpdate.status} → ${statusUpdate.recipient_id}`);
  }

  return {
    status: 200,
    body: { success: true, organization: merchant.organization_id },
    merchantContext,
    messageData,
    statusUpdate
  };
}

// ── Admin: List all registered merchants ──────────────────────────────
// Utility endpoint for the dashboard to show which merchants are onboarded.

async function listRegisteredMerchants() {
  const result = await pool.query(
    'SELECT * FROM merchant_whatsapp_settings',
    []
  );
  return result.rows;
}

module.exports = {
  verifyWebhook,
  handleIncoming,
  listRegisteredMerchants,
  registerPipelineListener
};
