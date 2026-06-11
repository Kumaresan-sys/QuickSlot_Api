const { Server } = require('socket.io');
const pool = require('./db');

let io;
const HOLD_TIMEOUT_MS = Number(process.env.SLOT_HOLD_TIMEOUT_MS || 30_000);
const holds = new Map();

function holdKey({ venueId, slotId, date }) {
  return `${venueId}:${slotId}:${date}`;
}

function emitSlotUpdate({ venueId, slotId, date, status, userId = null }) {
  const _io = getIo();
  const room = `venue:${venueId}`;
  const payload = { venueId, slotId, date, status, userId };
  _io.to(room).emit('slot_update', payload);
  _io.emit('slot_update', payload);
}

function releaseHoldByKey(key, { broadcast = true } = {}) {
  const hold = holds.get(key);
  if (!hold) return false;

  clearTimeout(hold.timer);
  holds.delete(key);

  if (broadcast) {
    emitSlotUpdate({
      venueId: hold.venueId,
      slotId: hold.slotId,
      date: hold.date,
      status: 'AVAILABLE',
      userId: hold.userId,
    });
  }

  return true;
}

function releaseUserHolds({ userId, socketId, venueId, date, exceptKey } = {}) {
  for (const [key, hold] of holds.entries()) {
    const matchesUser = userId && hold.userId === userId;
    const matchesSocket = socketId && hold.socketId === socketId;
    const matchesVenue = !venueId || hold.venueId === venueId;
    const matchesDate = !date || hold.date === date;

    if (
      (matchesUser || matchesSocket) &&
      matchesVenue &&
      matchesDate &&
      key !== exceptKey
    ) {
      releaseHoldByKey(key);
    }
  }
}

async function isSlotBooked({ venueId, slotId, date }) {
  const result = await pool.query(
    `SELECT 1
     FROM bookings
     WHERE venue_id = $1
       AND slot_id = $2
       AND booking_date = $3
       AND status = 'CONFIRMED'
     LIMIT 1`,
    [venueId, slotId, date]
  );
  return result.rowCount > 0;
}

async function holdSlot({ venueId, slotId, date, userId, socketId }) {
  if (!venueId || !slotId || !date || !userId) return false;
  if (await isSlotBooked({ venueId, slotId, date })) return false;

  const key = holdKey({ venueId, slotId, date });
  const existingHold = holds.get(key);
  if (existingHold && existingHold.userId !== userId) return false;

  releaseUserHolds({ userId, venueId, date, exceptKey: key });

  if (existingHold) {
    clearTimeout(existingHold.timer);
  }

  const timer = setTimeout(() => {
    releaseHoldByKey(key);
  }, HOLD_TIMEOUT_MS);

  holds.set(key, { venueId, slotId, date, userId, socketId, timer });

  emitSlotUpdate({ venueId, slotId, date, status: 'HELD', userId });
  return true;
}

function releaseSlotHold({ venueId, slotId, date, userId } = {}, options = {}) {
  const key = holdKey({ venueId, slotId, date });
  const hold = holds.get(key);
  if (!hold || (userId && hold.userId !== userId)) return false;
  return releaseHoldByKey(key, options);
}

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

    socket.on('slot_hold', async (payload) => {
      try {
        await holdSlot({ ...payload, socketId: socket.id });
      } catch (error) {
        console.error('Failed to hold slot:', error);
      }
    });

    socket.on('slot_release', (payload) => {
      releaseSlotHold(payload);
    });

    socket.on('disconnect', () => {
      releaseUserHolds({ socketId: socket.id });
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

module.exports = {
  initSocket,
  getIo,
  emitSlotUpdate,
  releaseSlotHold,
  holdSlot,
  releaseUserHolds,
};
