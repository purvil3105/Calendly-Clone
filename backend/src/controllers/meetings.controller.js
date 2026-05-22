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

exports.cancelMeeting = async (req, res, next) => {
  try {
    await meetingRepo.cancel(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
