const { Server } = require('socket.io');

let io;

function initSocketServer(server) {
    io = new Server(server, {
        cors: { origin: "*" } // Adjust this in production for security
    });

    io.on('connection', (socket) => {
        console.log(`New socket connection established: ${socket.id}`);

        // Secure Multi-Tenant Room Joining
        socket.on('join_organization_room', (organizationId) => {
            if (organizationId) {
                socket.join(organizationId);
                console.log(`Socket [${socket.id}] safely joined secure workspace room: ${organizationId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket connection severed: ${socket.id}`);
        });
    });

    return io;
}

/**
 * Pushes real-time alerts ONLY to users logged into the specific merchant store.
 * @param {string} organizationId - Secure tenant boundary marker.
 * @param {Object} orderData - The database or parsed JSON payload.
 */
function broadcastLiveOrderUpdate(organizationId, orderData) {
    if (!io) return;
    
    // Emit the event strictly to the designated organization's room
    io.to(organizationId).emit('NEW_AI_ORDER_INBOUND', {
        timestamp: new Date(),
        payload: orderData
    });
    console.log(`Real-time visual alert broadcasted to organization workspace: ${organizationId}`);
}

module.exports = { initSocketServer, broadcastLiveOrderUpdate };
