const { DateTime } = require('luxon');
const meetingRepo = require('../repositories/meetingRepo.js');
const emailService = require('./emailService.js');

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
  const meeting = await meetingRepo.create({
    eventTypeId: eventType.id,
    startAt: startDate,
    endAt: endDate,
    inviteeName: bookingData.inviteeName,
    inviteeEmail: bookingData.inviteeEmail,
    inviteeTimezone: bookingData.inviteeTimezone,
    notes: bookingData.notes,
    answers: bookingData.answers
  });

  // 3. Send Email
  emailService.sendBookingConfirmation(meeting, eventType);

  return meeting;
};

exports.rescheduleMeeting = async (meetingId, newStartAtISO) => {
  const meeting = await meetingRepo.findById(meetingId);
  if (!meeting) throw new Error("Meeting not found.");
  
  const eventType = meeting.eventType;
  const startDt = DateTime.fromISO(newStartAtISO, { zone: 'UTC' });
  const endDt = startDt.plus({ minutes: eventType.durationMin });
  
  const startDate = startDt.toJSDate();
  const endDate = endDt.toJSDate();

  // Verify conflict
  const conflict = await meetingRepo.findConflicting(startDate, endDate);
  
  // Ignore conflict if it's the SAME meeting
  if (conflict && conflict.id !== meetingId) {
    throw new Error("This time slot is no longer available.");
  }

  const updatedMeeting = await meetingRepo.reschedule(meetingId, startDate, endDate);
  
  // Send Email
  emailService.sendRescheduleNotice(updatedMeeting, eventType);

  return updatedMeeting;
};
