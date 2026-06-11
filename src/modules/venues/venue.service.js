const venueRepository = require("./venue.repository");

/**
 * Retrieve all venues.
 * @returns {Promise<Array>} List of venue objects.
 */
async function getVenues() {
  return venueRepository.findAllVenues();
}

async function getVenueSlots(venueId, date, startTime, endTime) {
  return venueRepository.findSlotsByVenueAndDate(venueId, date, startTime, endTime);
}

module.exports = {
  getVenues,
  getVenueSlots,
};
