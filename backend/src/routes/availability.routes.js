const express = require('express');
const availabilityController = require('../controllers/availability.controller.js');

const router = express.Router();

router.get('/', availabilityController.getAvailability);
router.put('/', availabilityController.updateAvailability);

module.exports = router;
