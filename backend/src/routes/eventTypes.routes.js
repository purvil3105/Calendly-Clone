const express = require('express');
const eventTypeController = require('../controllers/eventTypes.controller.js');

const router = express.Router();

router.get('/', eventTypeController.getAllEventTypes);
router.post('/', eventTypeController.createEventType);
router.put('/:id', eventTypeController.updateEventType);
router.delete('/:id', eventTypeController.deleteEventType);

module.exports = router;
