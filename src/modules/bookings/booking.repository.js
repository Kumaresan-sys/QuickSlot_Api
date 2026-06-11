const pool = require('../../config/db');

async function createBookingTransaction({ userId, venueId, slotId, bookingDate }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const slotResult = await client.query(
      `SELECT id, slot_time FROM slots WHERE id = $1 AND venue_id = $2`,
      [slotId, venueId]
    );

    if (slotResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, statusCode: 400, message: 'Invalid slot or venue' };
    }

    const slotTime = slotResult.rows[0].slot_time;

    const userOverlap = await client.query(
      `SELECT b.id
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       WHERE b.user_id = $1
         AND b.booking_date = $2
         AND s.slot_time = $3
         AND b.status = 'CONFIRMED'`,
      [userId, bookingDate, slotTime]
    );

    if (userOverlap.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        statusCode: 409,
        message: 'You already have another booking at this exact date and time',
      };
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, venue_id, slot_id, booking_date, status)
       VALUES ($1, $2, $3, $4, 'CONFIRMED')
       ON CONFLICT (venue_id, slot_id, booking_date) WHERE status = 'CONFIRMED'
       DO NOTHING
       RETURNING id, user_id, venue_id, slot_id, booking_date, status, created_at`,
      [userId, venueId, slotId, bookingDate]
    );

    if (bookingResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, statusCode: 409, message: 'Slot already taken' };
    }

    await client.query('COMMIT');
    return { success: true, statusCode: 201, data: bookingResult.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function findBookingById(bookingId) {
  const result = await pool.query(
    `SELECT b.*, v.name AS venue_name, v.location, s.slot_time
     FROM bookings b
     JOIN venues v ON v.id = b.venue_id
     JOIN slots s ON s.id = b.slot_id
     WHERE b.id = $1`,
    [bookingId]
  );
  return result.rows[0] || null;
}

async function findBookingsByUserId(userId) {
  const result = await pool.query(
    `SELECT
       b.id,
       b.booking_date,
       b.status,
       b.created_at,
       v.name AS venue_name,
       v.location,
       s.slot_time
     FROM bookings b
     JOIN venues v ON v.id = b.venue_id
     JOIN slots s ON s.id = b.slot_id
     WHERE b.user_id = $1
     ORDER BY b.booking_date DESC, s.slot_time ASC`,
    [userId]
  );
  return result.rows;
}

/**
 * Cancel a booking.
 * Returns the cancelled booking row, or null if not found / already cancelled.
 * Does NOT filter by user_id — ownership check is done in the service layer
 * so the controller can distinguish 403 from 404.
 */
async function findBookingForCancel(bookingId) {
  const result = await pool.query(
    `SELECT id, user_id, venue_id, slot_id, booking_date, status
     FROM bookings
     WHERE id = $1`,
    [bookingId]
  );
  return result.rows[0] || null;
}

async function cancelBooking(bookingId) {
  const result = await pool.query(
    `UPDATE bookings
     SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'CONFIRMED'
     RETURNING id, status, cancelled_at, venue_id, slot_id, booking_date`,
    [bookingId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createBookingTransaction,
  findBookingById,
  findBookingsByUserId,
  findBookingForCancel,
  cancelBooking,
};
