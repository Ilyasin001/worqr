import { api } from './client.js'

export const getMyCompany = ()   => api.get('/companies/me')
export const rotateCode   = ()   => api.post('/companies/rotate-code')
