const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const availabilityRuleSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, "Must be HH:mm"),
  end_time: z.string().regex(timeRegex, "Must be HH:mm"),
}).refine(data => data.start_time < data.end_time, {
  message: "End time must be after start time",
  path: ["end_time"]
});

const updateAvailabilitySchema = z.object({
  timezone: z.string().min(1),
  rules: z.array(availabilityRuleSchema),
});

module.exports = {
  updateAvailabilitySchema
};
