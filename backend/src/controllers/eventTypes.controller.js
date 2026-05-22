const eventTypeService = require('../services/eventTypeService.js');
const { eventTypeSchema } = require('../validators/eventType.validator.js');

exports.getAllEventTypes = async (req, res, next) => {
  try {
    const eventTypes = await eventTypeService.getAllEventTypes();
    res.json(eventTypes);
  } catch (error) {
    next(error);
  }
};

exports.createEventType = async (req, res, next) => {
  try {
    const data = eventTypeSchema.parse(req.body);
    const result = await eventTypeService.createEventType(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEventType = async (req, res, next) => {
  try {
    const data = eventTypeSchema.parse(req.body);
    const result = await eventTypeService.updateEventType(req.params.id, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEventType = async (req, res, next) => {
  try {
    await eventTypeService.deleteEventType(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
