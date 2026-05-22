import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const eventTypesAPI = {
  getAll: () => api.get('/event-types'),
  create: (data) => api.post('/event-types', data),
  update: (id, data) => api.put(`/event-types/${id}`, data),
  delete: (id) => api.delete(`/event-types/${id}`),
};

export const availabilityAPI = {
  get: () => api.get('/availability'),
  create: (data) => api.post('/availability', data),
  update: (id, data) => api.put(`/availability/${id}`, data),
  delete: (id) => api.delete(`/availability/${id}`),
  // Date Overrides
  getOverrides: (scheduleId) => api.get(`/availability/${scheduleId}/overrides`),
  upsertOverride: (scheduleId, data) => api.post(`/availability/${scheduleId}/overrides`, data),
  deleteOverride: (scheduleId, overrideId) => api.delete(`/availability/${scheduleId}/overrides/${overrideId}`),
};

export const publicAPI = {
  getEventDetails: (slug) => api.get(`/public/${slug}`),
  getAvailableSlots: (slug, start, end) => 
    api.get(`/public/${slug}/slots`, { params: { start, end } }),
  bookMeeting: (slug, data) => api.post(`/public/${slug}/book`, data),
};

export const meetingsAPI = {
  getAll: (status) => api.get('/meetings', { params: { status } }),
  getById: (id) => api.get(`/meetings/${id}`),
  cancel: (id) => api.post(`/meetings/${id}/cancel`),
  reschedule: (id, startAt) => api.patch(`/meetings/${id}/reschedule`, { startAt }),
};
