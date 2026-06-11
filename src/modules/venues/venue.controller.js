const venueService = require('./venue.service');
const { slotQuerySchema } = require('../../validators/venue.validator');

async function getVenues(req, res, next) {
  try {
    const venues = await venueService.getVenues();
    return res.status(200).json({ data: venues });
  } catch (error) {
    next(error);
  }
}

async function getVenue(req, res, next) {
  try {
    const { id } = req.params;
    const venue = await venueService.getVenueById(id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    return res.status(200).json({ data: venue });
  } catch (error) {
    next(error);
  }
}

async function getVenueSlots(req, res, next) {
  try {
    const { id } = req.params;

    const validation = slotQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: validation.error.flatten(),
      });
    }

    const { date, startTime, endTime } = validation.data;
    const slots = await venueService.getVenueSlots(id, date, startTime, endTime);

    return res.status(200).json({ data: slots });
  } catch (error) {
    next(error);
  }
}

module.exports = { getVenues, getVenue, getVenueSlots };
