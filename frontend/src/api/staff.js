import { api } from './client.js'

export const getStaff   = ()         => api.get('/users')
export const getStaffMember = (id)   => api.get(`/users/${id}`)
export const createStaff = (data)    => api.post('/users', data)
export const updateStaff = (id, data) => api.put(`/users/${id}`, data)
export const deleteStaff = (id)      => api.delete(`/users/${id}`)
