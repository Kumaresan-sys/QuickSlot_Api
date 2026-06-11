const venueRepository = require('./venue.repository');

async function getVenues() {
  return venueRepository.findAllVenues();
}

async function getVenueById(venueId) {
  return venueRepository.findVenueById(venueId);
}

async function getVenueSlots(venueId, date, startTime, endTime) {
  return venueRepository.findSlotsByVenueAndDate(venueId, date, startTime, endTime);
}

module.exports = { getVenues, getVenueById, getVenueSlots };
