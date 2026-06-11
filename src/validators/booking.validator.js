const { z } = require('zod');

const createBookingSchema = z.object({
  venueId: z.string().uuid(),
  slotId: z.string().uuid(),
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'bookingDate must be YYYY-MM-DD' })
    .refine(
      (dateStr) => {
        // Compare date strings directly to avoid timezone drift.
        // Both sides are YYYY-MM-DD so lexicographic comparison is correct.
        const todayStr = new Date().toISOString().slice(0, 10);
        return dateStr >= todayStr;
      },
      { message: 'bookingDate cannot be in the past' }
    ),
});

module.exports = { createBookingSchema };
