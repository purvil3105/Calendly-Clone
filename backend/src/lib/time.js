const { DateTime, IANAZone } = require("luxon");

function isValidTimezone(tz) {
  return IANAZone.isValidZone(tz);
}

function nowInTz(tz) {
  return DateTime.now().setZone(tz);
}

function toTz(isoString, tz) {
  return DateTime.fromISO(isoString, { zone: tz });
}

function dateTimeInTzToUTC(dateStr, timeStr, tz) {
  const dt = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: tz });
  return dt.toUTC();
}

function utcToTzTimeString(utcDt, tz) {
  return utcDt.setZone(tz).toFormat("HH:mm");
}

function getDayOfWeek(dateStr, tz) {
  const dt = DateTime.fromISO(dateStr, { zone: tz });
  return dt.weekday === 7 ? 0 : dt.weekday;
}

function formatForViewer(dt, tz) {
  return dt.setZone(tz).toFormat("HH:mm");
}

module.exports = {
  isValidTimezone,
  nowInTz,
  toTz,
  dateTimeInTzToUTC,
  utcToTzTimeString,
  getDayOfWeek,
  formatForViewer
};
