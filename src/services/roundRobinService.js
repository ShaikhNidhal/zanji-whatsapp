const pool = require('../db'); // Database pool connection

/**
 * Automatically assigns an incoming chat thread to the next available online operator.
 * @param {string} organizationId - Secure tenant boundary marker.
 * @returns {Promise<string|null>} The UUID of the assigned user, or null if no operators are online.
 */
async function assignOperatorRoundRobin(organizationId) {
    try {
        // 1. Fetch all online operators for this organization, sorted by who was assigned an order longest ago
        const operatorQuery = `
            SELECT u.id, COUNT(o.id) as active_assignments
            FROM users u
            LEFT JOIN orders o ON o.created_by_user_id = u.id AND o.created_at > NOW() - INTERVAL '24 hours'
            WHERE u.organization_id = $1 AND u.is_online = true AND u.role = 'operator'
            GROUP BY u.id
            ORDER BY active_assignments ASC, u.created_at ASC
            LIMIT 1;
        `;
        
        const result = await pool.query(operatorQuery, [organizationId]);

        if (result.rows.length === 0) {
            console.log(`No online operators available for Tenant [${organizationId}]. Falling back to unassigned pool.`);
            return null; // Cascades to unassigned queue
        }

        const assignedOperatorId = result.rows[0].id;
        console.log(`Round-Robin successfully allocated chat thread to Operator [${assignedOperatorId}]`);
        return assignedOperatorId;

    } catch (error) {
        console.error("Round-Robin Routing Engine Error:", error.message);
        return null; 
    }
}

module.exports = { assignOperatorRoundRobin };
