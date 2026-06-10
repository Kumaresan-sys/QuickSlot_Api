const venueRepository = require("./venue.repository");

async function getVenues() {
  return venueRepository.findAllVenues();
}

async function getVenueSlots(venueId, date) {
  return venueRepository.findSlotsByVenueAndDate(venueId, date);
}

module.exports = {
  getVenues,
  getVenueSlots,
};
