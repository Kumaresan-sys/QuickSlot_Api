const bookingService = require("./booking.service");
const { createBookingSchema } = require("../../validators/booking.validator");

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

    return res.status(201).json({
      message: "Booking created successfully",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

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
