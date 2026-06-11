const { Server } = require('socket.io');

let io;

function initSocket(server) {
  const allowedOrigin =
    process.env.SOCKET_ALLOWED_ORIGIN ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000';

  io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_venue', (venueId) => {
      if (typeof venueId === 'string' && venueId.trim()) {
        socket.join(`venue:${venueId}`);
      }
    });

    socket.on('leave_venue', (venueId) => {
      socket.leave(`venue:${venueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

/**
 * Emit a slot_update event to all sockets watching a specific venue.
 * Falls back to global broadcast in non-production for testing convenience.
 */
function emitSlotUpdate({ venueId, slotId, date, status }) {
  const _io = getIo();
  const room = `venue:${venueId}`;
  const payload = { venueId, slotId, date, status };
  _io.to(room).emit('slot_update', payload);
  _io.emit('slot_update', payload);
}

module.exports = { initSocket, getIo, emitSlotUpdate };
