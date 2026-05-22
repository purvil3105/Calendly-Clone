const { z } = require('zod');

const eventTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z.string().min(1, "Slug is required").max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with dashes"),
  duration_min: z.number().int().positive(),
  description: z.string().optional(),
  buffer_before: z.number().int().min(0).optional().default(0),
  buffer_after: z.number().int().min(0).optional().default(0),
  custom_questions: z.array(z.object({
    id: z.string(),
    label: z.string().min(1),
    type: z.enum(['text', 'textarea']),
    required: z.boolean(),
  })).optional(),
});

module.exports = {
  eventTypeSchema
};
