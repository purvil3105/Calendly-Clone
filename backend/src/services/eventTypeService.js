const eventTypeRepo = require('../repositories/eventTypeRepo.js');

exports.getAllEventTypes = async () => {
  return eventTypeRepo.findAll();
};

exports.getBySlug = async (slug) => {
  return eventTypeRepo.findBySlug(slug);
};

exports.createEventType = async (data) => {
  return eventTypeRepo.create(data);
};

exports.updateEventType = async (id, data) => {
  return eventTypeRepo.update(id, data);
};

exports.deleteEventType = async (id) => {
  return eventTypeRepo.delete(id);
};
