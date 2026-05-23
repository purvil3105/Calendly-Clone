const { DateTime } = require('luxon');
const meetingRepo = require('../repositories/meetingRepo.js');
const emailService = require('./emailService.js');

exports.bookMeeting = async (eventType, bookingData) => {
  const startDt = DateTime.fromISO(bookingData.startAt, { zone: 'UTC' });
  const endDt = startDt.plus({ minutes: eventType.durationMin });
  
  const startDate = startDt.toJSDate();
  const endDate = endDt.toJSDate();

  // 1. Verify concurrency / double-booking / capacity
  const overlappingMeetings = await meetingRepo.findOverlappingHostMeetings(eventType.userId, startDate, endDate);
  
  const capacity = eventType.capacity || 1;
  let bookedSpotsForThisSlot = 0;

  for (const m of overlappingMeetings) {
    // If it's the exact same event type and start time, it counts towards capacity
    if (m.eventTypeId === eventType.id && m.startAt.getTime() === startDate.getTime()) {
      bookedSpotsForThisSlot++;
    } else {
      // It's a different meeting entirely, host is blocked
      throw new Error("This time slot is no longer available.");
    }
  }

  if (bookedSpotsForThisSlot >= capacity) {
    throw new Error("This event is fully booked.");
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

  // 3. Send Email (caught so it doesn't crash the server if SMTP fails)
  emailService.sendBookingConfirmation(meeting, eventType)
    .catch(err => console.error("Failed to send booking email:", err));

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
  const overlappingMeetings = await meetingRepo.findOverlappingHostMeetings(eventType.userId, startDate, endDate);
  
  const capacity = eventType.capacity || 1;
  let bookedSpotsForThisSlot = 0;

  for (const m of overlappingMeetings) {
    // Ignore the meeting itself if we are just rescheduling to a slot it already holds (though technically start date changed)
    if (m.id === meetingId) continue;
    
    if (m.eventTypeId === eventType.id && m.startAt.getTime() === startDate.getTime()) {
      bookedSpotsForThisSlot++;
    } else {
      throw new Error("This time slot is no longer available.");
    }
  }

  if (bookedSpotsForThisSlot >= capacity) {
    throw new Error("This event is fully booked.");
  }

  const updatedMeeting = await meetingRepo.reschedule(meetingId, startDate, endDate);
  
  // Send Email (caught so it doesn't crash the server if SMTP fails)
  emailService.sendRescheduleNotice(updatedMeeting, eventType)
    .catch(err => console.error("Failed to send reschedule email:", err));

  return updatedMeeting;
};
