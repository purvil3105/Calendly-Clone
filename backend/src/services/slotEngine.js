const { DateTime } = require('luxon');
const { dateTimeInTzToUTC, getDayOfWeek, nowInTz } = require('../lib/time.js');

exports.generateSlotsForRange = ({
  startDt,
  endDt,
  durationMin,
  hostTimezone,
  availabilityRules,
  dateOverrides,
  existingMeetings,
}) => {
  const slots = [];
  
  const luxonStart = DateTime.fromJSDate(startDt).setZone(hostTimezone).startOf('day');
  const luxonEnd = DateTime.fromJSDate(endDt).setZone(hostTimezone).endOf('day');
  const nowHost = nowInTz(hostTimezone);
  
  for (let currDt = luxonStart; currDt <= luxonEnd; currDt = currDt.plus({ days: 1 })) {
    if (currDt < nowHost.startOf('day')) {
      continue;
    }

    const dateStr = currDt.toISODate();
    const dayOfWeek = getDayOfWeek(dateStr, hostTimezone);
    
    let isAvailableDay = false;
    let dayStartTime = "09:00";
    let dayEndTime = "17:00";

    const override = dateOverrides.find(o => DateTime.fromJSDate(o.date).toISODate() === dateStr);
    
    if (override) {
      isAvailableDay = override.isAvailable;
      if (isAvailableDay) {
        dayStartTime = override.startTime;
        dayEndTime = override.endTime;
      }
    } else {
      const rule = availabilityRules.find(r => r.dayOfWeek === dayOfWeek);
      if (rule) {
        isAvailableDay = true;
        dayStartTime = rule.startTime;
        dayEndTime = rule.endTime;
      }
    }

    if (!isAvailableDay) continue;

    const startUTC = dateTimeInTzToUTC(dateStr, dayStartTime, hostTimezone);
    const endUTC = dateTimeInTzToUTC(dateStr, dayEndTime, hostTimezone);

    let currentSlotStart = startUTC;
    
    while (currentSlotStart.plus({ minutes: durationMin }) <= endUTC) {
      const currentSlotEnd = currentSlotStart.plus({ minutes: durationMin });
      
      if (currentSlotStart <= nowHost) {
        currentSlotStart = currentSlotStart.plus({ minutes: 15 });
        continue;
      }

      const hasConflict = existingMeetings.some(meeting => {
        const mStart = DateTime.fromJSDate(meeting.startAt);
        const mEnd = DateTime.fromJSDate(meeting.endAt);
        return currentSlotStart < mEnd && currentSlotEnd > mStart;
      });

      if (!hasConflict) {
        slots.push({
          start: currentSlotStart.toISO(),
          end: currentSlotEnd.toISO()
        });
      }

      currentSlotStart = currentSlotStart.plus({ minutes: 15 });
    }
  }

  return slots;
};
