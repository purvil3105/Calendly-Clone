const express = require('express');
const availabilityController = require('../controllers/availability.controller.js');

const router = express.Router();

// Schedule CRUD
router.get('/', availabilityController.getAllSchedules);
router.post('/', availabilityController.createSchedule);
router.put('/:id', availabilityController.updateSchedule);
router.delete('/:id', availabilityController.deleteSchedule);

// Date Override CRUD (nested under schedule)
router.get('/:id/overrides', availabilityController.getOverrides);
router.post('/:id/overrides', availabilityController.upsertOverride);
router.delete('/:id/overrides/:overrideId', availabilityController.deleteOverride);

module.exports = router;
