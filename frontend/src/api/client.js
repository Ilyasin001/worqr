const BASE = 'http://localhost:3001/api'

const getToken   = () => localStorage.getItem('token')
const getRefresh = () => localStorage.getItem('refreshToken')

export const setTokens = (token, refreshToken) => {
  if (token) localStorage.setItem('token', token)
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
}
export const clearTokens = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
}

// Endpoints where a 401 means a genuine credential failure, not an expired
// access token — so we must NOT try to refresh (avoids loops).
const NO_REFRESH = [
  '/auth/login', '/auth/register', '/auth/refresh', '/auth/logout',
  '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email',
  '/companies/register',
]

async function doFetch(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

// Attempts to mint a new access token from the stored refresh token.
// De-duplicated so concurrent 401s only refresh once.
let refreshing = null
async function tryRefresh() {
  const refreshToken = getRefresh()
  if (!refreshToken) return false
  if (!refreshing) {
    refreshing = (async () => {
      const res = await doFetch('POST', '/auth/refresh', { refreshToken })
      if (!res.ok) return false
      const data = await res.json().catch(() => ({}))
      setTokens(data.token, data.refreshToken)
      return true
    })().finally(() => { refreshing = null })
  }
  return refreshing
}

async function request(method, path, body) {
  let res = await doFetch(method, path, body, getToken())

  if (res.status === 401 && getRefresh() && !NO_REFRESH.includes(path)) {
    const ok = await tryRefresh()
    if (ok) {
      res = await doFetch(method, path, body, getToken())
    } else {
      clearTokens()
      window.location.reload() // session truly expired — back to login
    }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
}
