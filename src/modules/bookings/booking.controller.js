const bookingService = require("./booking.service");
const { createBookingSchema } = require("../../validators/booking.validator");

/**
 * Create a new booking.
 * @param {Object} req - Express request.
 * @param {Object} req.body - Booking payload.
 * @param {Object} res - Express response.
 * @param {Function} next - Next middleware.
 */
async function createBooking(req, res, next) {
  try {
    const validation = createBookingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: validation.error.flatten(),
      });
    }

    const result = await bookingService.createBooking({
      userId: req.user.id,
      venueId: validation.data.venueId,
      slotId: validation.data.slotId,
      bookingDate: validation.data.bookingDate,
    });

    if (!result.success) {
      return res.status(result.statusCode).json({
        message: result.message,
      });
    }

    const { getIo } = require("../../config/socket");
    const io = getIo();
    io.emit("slot_update", {
      venueId: validation.data.venueId,
      slotId: validation.data.slotId,
      date: validation.data.bookingDate,
      status: "BOOKED"
    });

    return res.status(201).json({
      message: "Booking created successfully",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve bookings for a specific user.
 * @param {Object} req - Express request (expects :id param).
 * @param {Object} res - Express response.
 * @param {Function} next - Next middleware.
 */
async function getUserBookings(req, res, next) {
  try {
    const { id } = req.params;

    // User can only access own bookings
    if (req.user.id !== id) {
      return res.status(403).json({
        message: "You are not allowed to access these bookings",
      });
    }

    const bookings = await bookingService.getUserBookings(id);

    return res.status(200).json({
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    const cancelledBooking = await bookingService.cancelBooking({
      bookingId: id,
      userId: req.user.id,
    });

    if (!cancelledBooking) {
      return res.status(404).json({
        message: "Booking not found or already cancelled",
      });
    }

    const { getIo } = require("../../config/socket");
    const io = getIo();
    
    // Format Date object back to YYYY-MM-DD if needed
    const bookingDateStr = cancelledBooking.booking_date instanceof Date 
      ? cancelledBooking.booking_date.toISOString().split('T')[0]
      : cancelledBooking.booking_date;

    io.emit("slot_update", {
      venueId: cancelledBooking.venue_id,
      slotId: cancelledBooking.slot_id,
      date: bookingDateStr,
      status: "AVAILABLE"
    });

    return res.status(200).json({
      message: "Booking cancelled successfully",
      data: cancelledBooking,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
};
