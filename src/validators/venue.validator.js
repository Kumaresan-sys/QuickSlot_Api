const { z } = require('zod');

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

const slotQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' }),
  startTime: z
    .string()
    .regex(timeRegex, { message: 'startTime must be HH:MM or HH:MM:SS' })
    .optional(),
  endTime: z
    .string()
    .regex(timeRegex, { message: 'endTime must be HH:MM or HH:MM:SS' })
    .optional(),
});

module.exports = { slotQuerySchema };
