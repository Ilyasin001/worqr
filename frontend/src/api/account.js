import { api } from './client.js'

export const getMe              = ()                        => api.get('/auth/me')
export const updateMe           = (data)                    => api.patch('/auth/me', data)
export const changePassword     = (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword })
export const forgotPassword     = (email)                   => api.post('/auth/forgot-password', { email })
export const resetPassword      = (token, password)         => api.post('/auth/reset-password', { token, password })
export const verifyEmail        = (token)                   => api.post('/auth/verify-email', { token })
export const resendVerification = ()                        => api.post('/auth/resend-verification')
