const availabilityService = require('../services/availabilityService.js');
const { updateAvailabilitySchema } = require('../validators/availability.validator.js');

exports.getAvailability = async (req, res, next) => {
  try {
    const availability = await availabilityService.getAvailability();
    res.json(availability);
  } catch (error) {
    next(error);
  }
};

exports.updateAvailability = async (req, res, next) => {
  try {
    const data = updateAvailabilitySchema.parse(req.body);
    await availabilityService.updateAvailability(data.timezone, data.rules);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
