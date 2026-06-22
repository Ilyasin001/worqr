import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Events from './pages/Events.jsx'
import Shifts from './pages/Shifts.jsx'
import Staff from './pages/Staff.jsx'
import Assignments from './pages/Assignments.jsx'
import Payroll from './pages/Payroll.jsx'
import Profile from './pages/Profile.jsx'
import { api, setTokens, clearTokens } from './api/client.js'
import * as authApi from './api/auth.js'

// Token-based screens reached from emailed links — they work regardless of
// whether the visitor is signed in.
const goHome = () => { window.history.replaceState({}, '', '/'); window.location.reload() }

export default function App() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [authView, setAuthView] = useState('login') // 'login' | 'register' | 'forgot'

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const id = payload.id || payload._id || payload.userId
      api.get('/users/' + id)
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } catch {
      localStorage.removeItem('token')
      setLoading(false)
    }
  }, [])

  const completeAuth = (res) => {
    setTokens(res.token, res.refreshToken)
    setUser(res.user)
  }

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    completeAuth(res)
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // best-effort revocation; clear locally regardless
    }
    clearTokens()
    setUser(null)
  }

  // Deep links from emails — handled before auth gating.
  const path = window.location.pathname
  const urlToken = new URLSearchParams(window.location.search).get('token')
  if (path === '/verify-email') return <VerifyEmail token={urlToken} onDone={goHome} />
  if (path === '/reset-password') return <ResetPassword token={urlToken} onDone={goHome} />

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    if (authView === 'register')
      return <Register onAuth={completeAuth} onSwitchToLogin={() => setAuthView('login')} />
    if (authView === 'forgot')
      return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />
    return (
      <Login
        onLogin={login}
        onSwitchToRegister={() => setAuthView('register')}
        onForgotPassword={() => setAuthView('forgot')}
      />
    )
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/"            element={<Dashboard   user={user} />} />
          <Route path="/events"      element={<Events      user={user} />} />
          <Route path="/shifts"      element={<Shifts      user={user} />} />
          <Route path="/staff"       element={<Staff       user={user} />} />
          <Route path="/assignments" element={<Assignments user={user} />} />
          <Route path="/payroll"     element={<Payroll     user={user} />} />
          <Route path="/profile"     element={<Profile     user={user} onUserUpdate={setUser} />} />
          <Route path="*"            element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
