import { api } from './client.js'

export const login = (email, password) => api.post('/auth/login', { email, password })

// Staff joins an existing company using its join code.
export const register = (name, email, password, companyCode) =>
  api.post('/auth/register', { name, email, password, companyCode })

// Owner creates a brand-new company and its first admin account.
export const registerCompany = (companyName, name, email, password) =>
  api.post('/companies/register', { companyName, name, email, password })

export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken })
