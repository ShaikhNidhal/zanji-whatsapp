-- 20260604_zanji_core.sql
-- Create Zanji Core Database Tables (Supabase/PostgreSQL compatible)

-- 1. Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'PK',
    default_currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
    buyer_phone VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    shipping_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'shipped', 'delivered', 'returned_to_origin' (RTO)
    order_type VARCHAR(20) NOT NULL DEFAULT 'COD', -- 'COD', 'Digital'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Zanji Shield Risk Scores Table
CREATE TABLE IF NOT EXISTS zanji_shield_scores (
    id SERIAL PRIMARY KEY,
    buyer_phone VARCHAR(50) UNIQUE NOT NULL,
    historical_rto_count INTEGER NOT NULL DEFAULT 0,
    calculated_risk_tier VARCHAR(20) NOT NULL DEFAULT 'Green', -- 'Green', 'Yellow', 'Red'
    text_sentiment_flag VARCHAR(50) DEFAULT 'Neutral', -- 'Positive', 'Neutral', 'Aggressive'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Indexes for Cross-Merchant Optimization
CREATE INDEX IF NOT EXISTS idx_orders_buyer_phone ON orders(buyer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_shield_buyer_phone ON zanji_shield_scores(buyer_phone);

-- 5. Seed Initial Mock Data for Testing
INSERT INTO merchants (company_name, country_code, default_currency) VALUES
('Zari Boutique', 'PK', 'PKR'),
('Dubai Abaya Shop', 'AE', 'AED'),
('Bali Crafts', 'ID', 'IDR')
ON CONFLICT DO NOTHING;

INSERT INTO zanji_shield_scores (buyer_phone, historical_rto_count, calculated_risk_tier, text_sentiment_flag) VALUES
('+923155556789', 0, 'Green', 'Neutral'),
('+923009999999', 4, 'Red', 'Aggressive'), -- High RTO history
('+923218888888', 1, 'Yellow', 'Neutral'),
('+923334444444', 3, 'Red', 'Neutral') -- 3 RTOs
ON CONFLICT (buyer_phone) DO UPDATE SET 
    historical_rto_count = EXCLUDED.historical_rto_count,
    calculated_risk_tier = EXCLUDED.calculated_risk_tier,
    text_sentiment_flag = EXCLUDED.text_sentiment_flag;
