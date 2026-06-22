import { api } from './client.js'

const qs = (params = {}) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 'all')
  ).toString()
  return s ? `?${s}` : ''
}

export const getEvents   = (params) => api.get(`/events${qs(params)}`)
export const getEvent    = (id)       => api.get(`/events/${id}`)
export const createEvent = (data)     => api.post('/events', data)
export const updateEvent = (id, data) => api.put(`/events/${id}`, data)
export const deleteEvent = (id)       => api.delete(`/events/${id}`)
