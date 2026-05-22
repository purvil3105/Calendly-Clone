const { z } = require('zod');

const eventTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z.string().min(1, "Slug is required").max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with dashes"),
  duration_min: z.number().int().positive(),
  description: z.string().optional(),
});

module.exports = {
  eventTypeSchema
};
