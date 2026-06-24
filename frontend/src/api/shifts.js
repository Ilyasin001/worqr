import { api } from './client.js'

const qs = (params = {}) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 'all')
  ).toString()
  return s ? `?${s}` : ''
}

export const getShifts     = (params) => api.get(`/shifts${qs(params)}`)
export const getOpenShifts = ()        => api.get('/shifts/open')
export const claimShift    = (id)      => api.post(`/shifts/${id}/claim`)
export const getShift      = (id)      => api.get(`/shifts/${id}`)
export const createShift = (data)     => api.post('/shifts', data)
export const updateShift = (id, data) => api.put(`/shifts/${id}`, data)
export const deleteShift = (id)       => api.delete(`/shifts/${id}`)
