const express = require('express');
const meetingsController = require('../controllers/meetings.controller.js');

const router = express.Router();

router.get('/', meetingsController.getMeetings);
router.post('/:id/cancel', meetingsController.cancelMeeting);

module.exports = router;
