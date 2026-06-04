const pool = require('../db'); // Database pool connection

/**
 * Persists the completely parsed Gemini JSON payload into your isolated tenant storage.
 * @param {Object} parsedOrder - The clean JSON object returned from the Gemini AI.
 * @param {string} organizationId - Secure tenant boundary marker.
 * @returns {Object} The finalized, active row inserted into the database.
 */
async function saveParsedOrderToDatabase(parsedOrder, organizationId) {
    const client = await pool.connect();
    
    try {
        // Begin transaction block to ensure atomic multi-table integrity
        await client.query('BEGIN');

        const { order_metadata, customer_details, shipping_address, line_items } = parsedOrder;
        
        // Calculate a mock total amount based on business constraints (fallback default)
        const mockTotal = line_items.reduce((sum, item) => sum + (item.quantity * 1500), 0); 
        const consolidatedAddress = `${shipping_address.street_address}, ${shipping_address.city}`;

        // 1. Insert row into multi-tenant tracking table
        const orderInsertQuery = `
            INSERT INTO orders (organization_id, buyer_phone, total_amount, order_type, payment_status)
            VALUES ($1, $2, $3, 'COD', 'pending')
            RETURNING id, created_at;
        `;
        
        const orderResult = await client.query(orderInsertQuery, [
            organizationId,
            (customer_details && customer_details.phone) || 'UNKNOWN_WHATSAPP_SENDER',
            mockTotal
        ]);

        const orderId = orderResult.rows[0].id;

        // 2. Commit transaction successfully
        await client.query('COMMIT');
        console.log(`Successfully stored Order [${orderId}] for Tenant [${organizationId}]`);
        
        return orderResult.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Database Commit Abort for Tenant [${organizationId}]:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { saveParsedOrderToDatabase };
