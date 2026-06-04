-- 20260604_merchant_whatsapp.sql
-- Track the unique WhatsApp configuration for each store

CREATE TABLE IF NOT EXISTS merchant_whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, -- References organizations(id) (simulated context)
    waba_id VARCHAR(255) UNIQUE NOT NULL, -- Meta's WhatsApp Business Account ID
    phone_number_id VARCHAR(255) UNIQUE NOT NULL, -- Meta's Phone Number ID
    display_phone_number VARCHAR(50) NOT NULL, -- The actual WhatsApp number (e.g., "+923001234567")
    webhook_verify_token VARCHAR(255) NOT NULL, -- Unique token to verify Meta connection
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add an index to make lookup instant when a customer messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_id ON merchant_whatsapp_settings(phone_number_id);
