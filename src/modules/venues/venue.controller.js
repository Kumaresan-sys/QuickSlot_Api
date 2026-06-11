const venueService = require("./venue.service");

/**
 * Get all venues.
 * @param {Object} req - Express request.
 * @param {Object} res - Express response.
 * @param {Function} next - Next middleware.
 */
async function getVenues(req, res, next) {
  try {
    const venues = await venueService.getVenues();

    return res.status(200).json({
      data: venues,
    });
  } catch (error) {
    next(error);
  }
}

async function getVenueSlots(req, res, next) {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date query parameter is required",
      });
    }

    const slots = await venueService.getVenueSlots(id, date, startTime, endTime);

    return res.status(200).json({
      data: slots,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVenues,
  getVenueSlots,
};
