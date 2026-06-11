const bookingRepository = require('./booking.repository');

async function createBooking(payload) {
  return bookingRepository.createBookingTransaction(payload);
}

async function getUserBookings(userId) {
  return bookingRepository.findBookingsByUserId(userId);
}

/**
 * Get a single booking by ID.
 * Returns the booking if the requesting user owns it, 'forbidden' if they don't,
 * or null if the booking doesn't exist.
 */
async function getBooking({ bookingId, userId }) {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) return null;
  if (booking.user_id !== userId) return 'forbidden';
  return booking;
}

/**
 * Cancel a booking.
 * Returns the cancelled row on success, 'forbidden' if the user doesn't own it,
 * or 'not_found' if the booking doesn't exist or is already cancelled.
 */
async function cancelBooking({ bookingId, userId }) {
  const booking = await bookingRepository.findBookingForCancel(bookingId);

  if (!booking) return 'not_found';
  if (booking.user_id !== userId) return 'forbidden';
  if (booking.status !== 'CONFIRMED') return 'not_found';

  const cancelled = await bookingRepository.cancelBooking(bookingId);
  return cancelled || 'not_found';
}

module.exports = { createBooking, getUserBookings, getBooking, cancelBooking };
