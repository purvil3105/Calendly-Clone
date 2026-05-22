const { z } = require('zod');

const bookMeetingSchema = z.object({
  startAt: z.string().datetime(),
  inviteeName: z.string().min(1, "Name is required"),
  inviteeEmail: z.string().email("Invalid email address"),
  inviteeTimezone: z.string().min(1),
  notes: z.string().optional(),
});

module.exports = {
  bookMeetingSchema
};
