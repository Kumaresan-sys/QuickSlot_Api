const bookingRepository = require("./booking.repository");

/**
 * Create a new booking.
 * @param {Object} payload - Booking details (userId, venueId, slotId, bookingDate).
 * @returns {Promise<Object>} Result of the booking transaction.
 */
async function createBooking(payload) {
  return bookingRepository.createBookingTransaction(payload);
}

/**
 * Retrieve all bookings for a given user.
 * @param {string|number} userId - Identifier of the user.
 * @returns {Promise<Array>} List of bookings.
 */
async function getUserBookings(userId) {
  return bookingRepository.findBookingsByUserId(userId);
}

/**
 * Cancel a booking if it belongs to the user.
 * @param {Object} param0 - Parameters.
 * @param {string|number} param0.bookingId - Booking identifier.
 * @param {string|number} param0.userId - User identifier.
 * @returns {Promise<Object|null>} Cancelled booking or null if not found.
 */
async function cancelBooking({ bookingId, userId }) {
  return bookingRepository.cancelBooking({ bookingId, userId });
}

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
};
