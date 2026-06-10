const { z } = require("zod");

const createBookingSchema = z.object({
  venueId: z.string().uuid(),
  slotId: z.string().uuid(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "bookingDate must be YYYY-MM-DD",
  }),
});

module.exports = {
  createBookingSchema,
};
