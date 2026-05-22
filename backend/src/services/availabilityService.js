const availabilityRepo = require('../repositories/availabilityRepo.js');
const meetingRepo = require('../repositories/meetingRepo.js');
const prisma = require('../lib/prisma.js');
const { generateSlotsForRange } = require('./slotEngine.js');

exports.getAvailability = async () => {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  
  const rules = await availabilityRepo.findRules();
  
  return {
    timezone: user.timezone,
    rules: rules.map(r => ({
      day_of_week: r.dayOfWeek,
      start_time: r.startTime,
      end_time: r.endTime
    }))
  };
};

exports.updateAvailability = async (timezone, rules) => {
  return availabilityRepo.updateAvailability(timezone, rules);
};

exports.getAvailableSlots = async (eventType, startISO, endISO) => {
  const startDt = new Date(startISO);
  const endDt = new Date(endISO);
  
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  
  const rules = await availabilityRepo.findRules();
  const overrides = await availabilityRepo.findOverrides(startDt, endDt);
  const existingMeetings = await meetingRepo.findUpcomingBetween(startDt, endDt);
  
  return generateSlotsForRange({
    startDt,
    endDt,
    durationMin: eventType.durationMin,
    hostTimezone: user.timezone,
    availabilityRules: rules,
    dateOverrides: overrides,
    existingMeetings
  });
};
