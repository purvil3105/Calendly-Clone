const availabilityRepo = require('../repositories/availabilityRepo.js');
const meetingRepo = require('../repositories/meetingRepo.js');
const scheduleRepo = require('../repositories/scheduleRepo.js');
const prisma = require('../lib/prisma.js');
const { generateSlotsForRange } = require('./slotEngine.js');

exports.getAllSchedules = async () => {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  
  return scheduleRepo.findByUserId(user.id);
};

exports.createSchedule = async (data) => {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  return scheduleRepo.create({
    userId: user.id,
    name: data.name,
    timezone: data.timezone,
  });
};

exports.updateSchedule = async (scheduleId, name, timezone, rules) => {
  // Update name and timezone
  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { name, timezone }
  });
  // Update rules
  return availabilityRepo.updateAvailability(scheduleId, timezone, rules);
};

exports.deleteSchedule = async (scheduleId) => {
  return scheduleRepo.delete(scheduleId);
};

exports.getAvailableSlots = async (eventType, startISO, endISO) => {
  const startDt = new Date(startISO);
  const endDt = new Date(endISO);
  
  const schedule = await prisma.schedule.findUnique({
    where: { id: eventType.scheduleId }
  });
  if (!schedule) throw new Error("Schedule not found for this event type");
  
  const rules = await availabilityRepo.findRules(eventType.scheduleId);
  const overrides = await availabilityRepo.findOverrides(eventType.scheduleId, startDt, endDt);
  const existingMeetings = await meetingRepo.findUpcomingBetween(startDt, endDt);
  
  return generateSlotsForRange({
    startDt,
    endDt,
    durationMin: eventType.durationMin,
    hostTimezone: schedule.timezone,
    availabilityRules: rules,
    dateOverrides: overrides,
    existingMeetings,
    eventType
  });
};

// ─── Date Override Services ──────────────────────────────
exports.getOverrides = async (scheduleId) => {
  return availabilityRepo.findOverridesByScheduleId(scheduleId);
};

exports.upsertOverride = async (scheduleId, date, startTime, endTime) => {
  return availabilityRepo.upsertOverride(scheduleId, new Date(date), startTime, endTime);
};

exports.deleteOverride = async (overrideId) => {
  return availabilityRepo.deleteOverride(overrideId);
};
