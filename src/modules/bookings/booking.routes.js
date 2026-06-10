const express = require("express");
const router = express.Router();

const bookingController = require("./booking.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/", authMiddleware, bookingController.createBooking);
router.delete("/:id", authMiddleware, bookingController.cancelBooking);

module.exports = router;
