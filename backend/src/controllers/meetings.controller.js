const meetingRepo = require('../repositories/meetingRepo.js');

exports.getMeetings = async (req, res, next) => {
  try {
    const status = req.query.status === 'past' ? 'past' : 'upcoming';
    const meetings = await meetingRepo.findAllByStatus(status);
    res.json(meetings);
  } catch (error) {
    next(error);
  }
};

exports.getMeetingById = async (req, res, next) => {
  try {
    const meeting = await meetingRepo.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json(meeting);
  } catch (error) {
    next(error);
  }
};

exports.cancelMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingRepo.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    await meetingRepo.cancel(req.params.id);
    
    const emailService = require('../services/emailService.js');
    emailService.sendCancellationNotice(meeting, meeting.eventType);
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.rescheduleMeeting = async (req, res, next) => {
  try {
    const { startAt } = req.body;
    const meetingService = require('../services/bookingService.js');
    const meeting = await meetingService.rescheduleMeeting(req.params.id, startAt);
    res.json(meeting);
  } catch (error) {
    if (error.message === "This time slot is no longer available.") {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};
