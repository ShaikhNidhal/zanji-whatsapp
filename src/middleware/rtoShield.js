const pool = require('../db'); // Database pool connection

/**
 * Assesses the risk of an inbound order using cross-tenant metrics and address text.
 * @param {string} buyerPhone - The customer's WhatsApp number.
 * @param {Object} shippingAddress - The extracted address block from Gemini.
 * @returns {Promise<Object>} Risk analysis output containing the tier and recommended system action.
 */
async function assessOrderRisk(buyerPhone, shippingAddress) {
    try {
        // 1. Check network-wide history for this phone number
        const networkQuery = `
            SELECT id, shipping_status 
            FROM orders 
            WHERE buyer_phone = $1
        `;
        const networkResult = await pool.query(networkQuery, [buyerPhone]);
        const historicalRtoCount = (networkResult.rows || []).filter(
            r => r.shipping_status === 'returned'
        ).length;

        //  evaluation is based on lowercase check
        const addressText = (shippingAddress.street_address || '').toLowerCase();
        let isIncompleteAddress = false;

        // Common high-risk address omissions in emerging markets
        if (!addressText.includes('house') && !addressText.includes('shop') && !addressText.includes('flat') && !addressText.includes('apt')) {
            isIncompleteAddress = true;
        }

        // 3. Assign Risk Tiers based on metrics
        let riskTier = 'GREEN';
        let systemAction = 'PROCESS_NORMALLY';

        if (historicalRtoCount >= 3 || (historicalRtoCount >= 1 && isIncompleteAddress)) {
            riskTier = 'RED';
            systemAction = 'REQUIRE_PREPAYMENT_OR_GPS';
        } else if (historicalRtoCount > 0 || isIncompleteAddress) {
            riskTier = 'YELLOW';
            systemAction = 'MANUAL_VERIFICATION_REQUIRED';
        }

        return {
            risk_tier: riskTier,
            historical_rto_count: historicalRtoCount,
            address_flag: isIncompleteAddress ? 'INCOMPLETE' : 'VALID',
            system_action: systemAction
        };

    } catch (error) {
        console.error("Antigravity Shield system failure:", error.message);
        // Fail-safe to avoid blocking order ingestion if the shield database lookup hangs
        return { risk_tier: 'GREEN', system_action: 'PROCESS_NORMALLY' };
    }
}

module.exports = { assessOrderRisk };
