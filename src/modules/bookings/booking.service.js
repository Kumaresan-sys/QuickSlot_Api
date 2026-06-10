const bookingRepository = require("./booking.repository");

async function createBooking(payload) {
  return bookingRepository.createBookingTransaction(payload);
}

async function getUserBookings(userId) {
  return bookingRepository.findBookingsByUserId(userId);
}

async function cancelBooking({ bookingId, userId }) {
  return bookingRepository.cancelBooking({ bookingId, userId });
}

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
};
