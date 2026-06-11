const bookingService = require('./booking.service');
const { createBookingSchema } = require('../../validators/booking.validator');
const { emitSlotUpdate, releaseSlotHold } = require('../../config/socket');

/**
 * Create a new booking.
 */
async function createBooking(req, res, next) {
  try {
    const validation = createBookingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid input',
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

    releaseSlotHold(
      {
        venueId: validation.data.venueId,
        slotId: validation.data.slotId,
        date: validation.data.bookingDate,
      },
      {
        broadcast: false,
      }
    );

    emitSlotUpdate({
      venueId: validation.data.venueId,
      slotId: validation.data.slotId,
      date: validation.data.bookingDate,
      status: 'BOOKED',
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve bookings for a specific user.
 */
async function getUserBookings(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({
        message: 'You are not allowed to access these bookings',
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

/**
 * Get a single booking by ID. Only the owner can fetch it.
 */
async function getBooking(req, res, next) {
  try {
    const { id } = req.params;
    const result = await bookingService.getBooking({
      bookingId: id,
      userId: req.user.id,
    });

    if (result === null) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (result === 'forbidden') {
      return res
        .status(403)
        .json({ message: 'You are not allowed to access this booking' });
    }

    return res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel a booking. Returns 403 if the booking belongs to another user,
 * 404 if it doesn't exist or is already cancelled.
 */
async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    const result = await bookingService.cancelBooking({
      bookingId: id,
      userId: req.user.id,
    });

    if (result === 'not_found') {
      return res.status(404).json({
        message: 'Booking not found or already cancelled',
      });
    }

    if (result === 'forbidden') {
      return res.status(403).json({
        message: 'You are not allowed to cancel this booking',
      });
    }

    const bookingDateStr =
      result.booking_date instanceof Date
        ? result.booking_date.toISOString().split('T')[0]
        : result.booking_date;

    emitSlotUpdate({
      venueId: result.venue_id,
      slotId: result.slot_id,
      date: bookingDateStr,
      status: 'AVAILABLE',
    });

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
};
