const pool = require("../../config/db");

async function findAllVenues() {
  const result = await pool.query(
    `SELECT id, name, location, created_at
     FROM venues
     ORDER BY created_at DESC`
  );

  return result.rows;
}

async function findSlotsByVenueAndDate(venueId, date, startTime, endTime) {
  let query = `
    SELECT 
      s.id AS slot_id,
      s.slot_time,
      CASE 
        WHEN b.id IS NULL THEN 'AVAILABLE'
        ELSE 'BOOKED'
      END AS status
    FROM slots s
    LEFT JOIN bookings b 
      ON b.slot_id = s.id
      AND b.venue_id = s.venue_id
      AND b.booking_date = $2
      AND b.status = 'CONFIRMED'
    WHERE s.venue_id = $1
  `;
  
  const values = [venueId, date];

  if (startTime) {
    values.push(startTime);
    query += ` AND s.slot_time >= $${values.length}`;
  }

  if (endTime) {
    values.push(endTime);
    query += ` AND s.slot_time <= $${values.length}`;
  }

  query += ` ORDER BY s.slot_time ASC`;

  const result = await pool.query(query, values);

  return result.rows;
}

module.exports = {
  findAllVenues,
  findSlotsByVenueAndDate,
};
