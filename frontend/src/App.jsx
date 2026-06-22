import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Events from './pages/Events.jsx'
import Shifts from './pages/Shifts.jsx'
import Staff from './pages/Staff.jsx'
import Assignments from './pages/Assignments.jsx'
import Payroll from './pages/Payroll.jsx'
import { api } from './api/client.js'
import * as authApi from './api/auth.js'

export default function App() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [authView, setAuthView] = useState('login') // 'login' | 'register'

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
    localStorage.setItem('token', res.token)
    setUser(res.user)
  }

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    completeAuth(res)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    return authView === 'register'
      ? <Register onAuth={completeAuth} onSwitchToLogin={() => setAuthView('login')} />
      : <Login onLogin={login} onSwitchToRegister={() => setAuthView('register')} />
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
          <Route path="*"            element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
