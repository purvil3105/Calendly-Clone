const eventTypeService = require('../services/eventTypeService.js');
const availabilityService = require('../services/availabilityService.js');
const bookingService = require('../services/bookingService.js');
const { bookMeetingSchema } = require('../validators/booking.validator.js');

exports.getEventDetails = async (req, res, next) => {
  try {
    const eventType = await eventTypeService.getBySlug(req.params.slug);
    if (!eventType) {
      return res.status(404).json({ message: "Event type not found" });
    }
    
    // Also fetch the host timezone to display
    const availability = await availabilityService.getAvailability();
    
    res.json({
      eventType,
      hostTimezone: availability.timezone
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { start, end } = req.query; // ISO strings for the month range

    if (!start || !end) {
      return res.status(400).json({ message: "start and end query parameters are required" });
    }

    const eventType = await eventTypeService.getBySlug(slug);
    if (!eventType) {
      return res.status(404).json({ message: "Event type not found" });
    }

    const slots = await availabilityService.getAvailableSlots(
      eventType,
      start,
      end
    );

    res.json(slots);
  } catch (error) {
    next(error);
  }
};

exports.bookMeeting = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = bookMeetingSchema.parse(req.body);

    const eventType = await eventTypeService.getBySlug(slug);
    if (!eventType) {
      return res.status(404).json({ message: "Event type not found" });
    }

    const meeting = await bookingService.bookMeeting(eventType, data);
    res.status(201).json(meeting);
  } catch (error) {
    if (error.message === "This time slot is no longer available.") {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};
