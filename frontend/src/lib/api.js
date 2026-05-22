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
  update: (data) => api.put('/availability', data),
};

export const publicAPI = {
  getEventDetails: (slug) => api.get(`/public/${slug}`),
  getAvailableSlots: (slug, start, end) => 
    api.get(`/public/${slug}/slots`, { params: { start, end } }),
  bookMeeting: (slug, data) => api.post(`/public/${slug}/book`, data),
};

export const meetingsAPI = {
  getAll: (status) => api.get('/meetings', { params: { status } }),
  cancel: (id) => api.post(`/meetings/${id}/cancel`),
};
