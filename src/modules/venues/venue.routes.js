const express = require("express");
const router = express.Router();

const venueController = require("./venue.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/", authMiddleware, venueController.getVenues);
router.get("/:id/slots", authMiddleware, venueController.getVenueSlots);

module.exports = router;
