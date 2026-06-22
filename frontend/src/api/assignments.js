import { api } from './client.js'

export const getAssignments   = ()         => api.get('/assignments')
export const getAssignment    = (id)       => api.get(`/assignments/${id}`)
export const createAssignment = (data)     => api.post('/assignments', data)
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data)
export const updateAssignmentStatus = (id, status) => api.patch(`/assignments/${id}/status`, { status })
export const deleteAssignment = (id)       => api.delete(`/assignments/${id}`)
