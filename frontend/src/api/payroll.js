import { api } from './client.js'

export const getMyHistory = ()       => api.get('/payroll/my-history')
export const getBatches   = ()       => api.get('/payroll/batches')
export const createDraft  = (data)   => api.post('/payroll/draft', data)
export const approve      = (id)     => api.post(`/payroll/${id}/approve`)
export const finalize     = (id)     => api.post(`/payroll/${id}/finalize`)
export const getSummary   = (year)   => api.get(`/payroll/summary?year=${year}`)
