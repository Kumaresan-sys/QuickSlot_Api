const { z } = require("zod");

const createBookingSchema = z.object({
  venueId: z.string().uuid(),
  slotId: z.string().uuid(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "bookingDate must be YYYY-MM-DD",
  }).refine((dateStr) => {
    // Ensure date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today in local time
    const bookingDate = new Date(dateStr);
    return bookingDate >= today;
  }, {
    message: "bookingDate cannot be in the past",
  }),
});

module.exports = {
  createBookingSchema,
};
