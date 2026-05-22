const express = require('express');
const publicController = require('../controllers/public.controller.js');

const router = express.Router();

router.get('/:slug', publicController.getEventDetails);
router.get('/:slug/slots', publicController.getAvailableSlots);
router.post('/:slug/book', publicController.bookMeeting);

module.exports = router;
