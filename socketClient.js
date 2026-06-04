import { io } from 'socket.io-client';

// Simulated state variable to hold all live chat threads for the logged-in operator
let activeChatThreads = [];
let currentSocketConnection = null;

/**
 * Initializes the WebSocket connection for a newly logged-in merchant operator.
 * @param {string} organizationId - The unique shop account ID fetched from the user's login JWT.
 * @param {string} currentOperatorId - The unique user ID of the logged-in employee.
 * @param {Function} onNewOrderCallback - A UI state modifier function to update the dashboard.
 */
export function initializeLiveInbox(organizationId, currentOperatorId, onNewOrderCallback) {
    // 1. Establish the direct pipe to your running Node.js server
    currentSocketConnection = io('http://localhost:3000');

    currentSocketConnection.on('connect', () => {
        console.log(`Connected to Zanji Engine with Socket ID: ${currentSocketConnection.id}`);
        
        // 2. Immediately join the secure multi-tenant room to wall off data
        currentSocketConnection.emit('join_organization_room', organizationId);
    });

    // 3. Listen for incoming AI parsed orders routed by your backend
    currentSocketConnection.on('NEW_AI_ORDER_INBOUND', (eventData) => {
        const { order_id, assigned_operator_id, extracted_data } = eventData.payload;

        console.log(`Live order event trapped on frontend for order: ${order_id}`);

        // 4. Construct a structured conversation UI object
        const incomingThreadUpdate = {
            id: order_id,
            buyerPhone: extracted_data.customer_details.phone,
            deliveryCity: extracted_data.shipping_address.city,
            items: extracted_data.line_items,
            riskTier: extracted_data.risk_assessment.risk_tier, // GREEN, YELLOW, RED
            systemAction: extracted_data.risk_assessment.system_action,
            isAssignedToMe: assigned_operator_id === currentOperatorId,
            isUnassigned: assigned_operator_id === 'UNASSIGNED'
        };

        // 5. Fire the callback to force your web browser to re-render the view without refreshing
        onNewOrderCallback(incomingThreadUpdate);
    });

    currentSocketConnection.on('disconnect', () => {
        console.warn('Lost connection to Zanji Core Server. Attempting reconnection...');
    });
}

/**
 * Cleanly breaks the WebSocket stream when an operator logs out.
 */
export function disconnectLiveInbox() {
    if (currentSocketConnection) {
        currentSocketConnection.disconnect();
        console.log('Socket stream disconnected safely.');
    }
}
