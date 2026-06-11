const express = require('express');
const router = express.Router();

const bookingController = require('../bookings/booking.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/:id/bookings', authMiddleware, bookingController.getUserBookings);

module.exports = router;
