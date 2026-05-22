const { DateTime } = require('luxon');
const meetingRepo = require('../repositories/meetingRepo.js');

exports.bookMeeting = async (eventType, bookingData) => {
  const startDt = DateTime.fromISO(bookingData.startAt, { zone: 'UTC' });
  const endDt = startDt.plus({ minutes: eventType.durationMin });
  
  const startDate = startDt.toJSDate();
  const endDate = endDt.toJSDate();

  // 1. Verify concurrency / double-booking
  const conflict = await meetingRepo.findConflicting(startDate, endDate);
  
  if (conflict) {
    throw new Error("This time slot is no longer available.");
  }

  // 2. Create the meeting
  return meetingRepo.create({
    eventTypeId: eventType.id,
    startAt: startDate,
    endAt: endDate,
    inviteeName: bookingData.inviteeName,
    inviteeEmail: bookingData.inviteeEmail,
    inviteeTimezone: bookingData.inviteeTimezone,
    notes: bookingData.notes
  });
};
