import { api } from './client.js'

export const getEvents   = ()         => api.get('/events')
export const getEvent    = (id)       => api.get(`/events/${id}`)
export const createEvent = (data)     => api.post('/events', data)
export const updateEvent = (id, data) => api.put(`/events/${id}`, data)
export const deleteEvent = (id)       => api.delete(`/events/${id}`)
