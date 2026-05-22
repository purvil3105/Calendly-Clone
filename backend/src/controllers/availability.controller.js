const availabilityService = require('../services/availabilityService.js');
const { updateAvailabilitySchema, createScheduleSchema } = require('../validators/availability.validator.js');

exports.getAllSchedules = async (req, res, next) => {
  try {
    const schedules = await availabilityService.getAllSchedules();
    res.json(schedules);
  } catch (error) {
    next(error);
  }
};

exports.createSchedule = async (req, res, next) => {
  try {
    const data = createScheduleSchema.parse(req.body);
    const newSchedule = await availabilityService.createSchedule(data);
    res.status(201).json(newSchedule);
  } catch (error) {
    next(error);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const scheduleId = req.params.id;
    const data = updateAvailabilitySchema.parse(req.body);
    await availabilityService.updateSchedule(scheduleId, data.name, data.timezone, data.rules);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    const scheduleId = req.params.id;
    await availabilityService.deleteSchedule(scheduleId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── Date Override Endpoints ─────────────────────────────
exports.getOverrides = async (req, res, next) => {
  try {
    const overrides = await availabilityService.getOverrides(req.params.id);
    res.json(overrides);
  } catch (error) {
    next(error);
  }
};

exports.upsertOverride = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    const override = await availabilityService.upsertOverride(
      req.params.id,
      date,
      startTime || null,
      endTime || null
    );
    res.json(override);
  } catch (error) {
    next(error);
  }
};

exports.deleteOverride = async (req, res, next) => {
  try {
    await availabilityService.deleteOverride(req.params.overrideId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
