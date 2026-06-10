const pool = require("../../config/db");

async function createBookingTransaction({ userId, venueId, slotId, bookingDate }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validate slot belongs to venue and lock the slot row
    const slotResult = await client.query(
      `
      SELECT id, venue_id
      FROM slots
      WHERE id = $1 AND venue_id = $2
      FOR UPDATE
      `,
      [slotId, venueId]
    );

    if (slotResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        statusCode: 400,
        message: "Invalid slot or venue",
      };
    }

    // Check existing confirmed booking
    const existingBooking = await client.query(
      `
      SELECT id
      FROM bookings
      WHERE venue_id = $1
        AND slot_id = $2
        AND booking_date = $3
        AND status = 'CONFIRMED'
      `,
      [venueId, slotId, bookingDate]
    );

    if (existingBooking.rowCount > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        statusCode: 409,
        message: "Slot already taken",
      };
    }

    const bookingResult = await client.query(
      `
      INSERT INTO bookings 
        (user_id, venue_id, slot_id, booking_date, status)
      VALUES 
        ($1, $2, $3, $4, 'CONFIRMED')
      RETURNING id, user_id, venue_id, slot_id, booking_date, status, created_at
      `,
      [userId, venueId, slotId, bookingDate]
    );

    await client.query("COMMIT");

    return {
      success: true,
      statusCode: 201,
      data: bookingResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");

    // PostgreSQL unique violation
    if (error.code === "23505") {
      return {
        success: false,
        statusCode: 409,
        message: "Slot already taken",
      };
    }

    throw error;
  } finally {
    client.release();
  }
}

async function findBookingsByUserId(userId) {
  const result = await pool.query(
    `
    SELECT 
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
    ORDER BY b.booking_date DESC, s.slot_time ASC
    `,
    [userId]
  );

  return result.rows;
}

async function cancelBooking({ bookingId, userId }) {
  const result = await pool.query(
    `
    UPDATE bookings
    SET 
      status = 'CANCELLED',
      cancelled_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND user_id = $2
      AND status = 'CONFIRMED'
    RETURNING id, status, cancelled_at
    `,
    [bookingId, userId]
  );

  return result.rows[0];
}

module.exports = {
  createBookingTransaction,
  findBookingsByUserId,
  cancelBooking,
};
