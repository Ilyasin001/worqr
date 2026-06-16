import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Events from './pages/Events.jsx'
import Shifts from './pages/Shifts.jsx'
import Staff from './pages/Staff.jsx'
import Assignments from './pages/Assignments.jsx'
import Payroll from './pages/Payroll.jsx'

export default function App() {
  const [user, setUser] = useState(null)

  const login = (email) => {
    const isAdmin = email.toLowerCase().includes('admin')
    setUser({
      name: isAdmin ? 'Alex Morgan' : 'Jordan Lee',
      email,
      role: isAdmin ? 'admin' : 'staff',
      hourlyRate: isAdmin ? 20 : 13.50,
    })
  }

  const logout = () => setUser(null)

  if (!user) return <Login onLogin={login} />

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/events" element={<Events user={user} />} />
          <Route path="/shifts" element={<Shifts user={user} />} />
          <Route path="/staff" element={<Staff user={user} />} />
          <Route path="/assignments" element={<Assignments user={user} />} />
          <Route path="/payroll" element={<Payroll user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
