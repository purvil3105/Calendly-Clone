const express = require('express');
const meetingsController = require('../controllers/meetings.controller.js');

const router = express.Router();

router.get('/', meetingsController.getMeetings);
router.get('/:id', meetingsController.getMeetingById);
router.post('/:id/cancel', meetingsController.cancelMeeting);
router.patch('/:id/reschedule', meetingsController.rescheduleMeeting);

module.exports = router;
