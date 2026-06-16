import { useState } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter both email and password.'); return }
    onLogin(email)
  }

  const fill = (e, p) => { setEmail(e); setPassword(p); setError('') }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">W</div>
          <span className="login-logo-text">WORQR</span>
        </div>

        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in to your workforce dashboard</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" className="login-btn">Sign in →</button>
        </form>

        <div className="login-hint">
          <strong>Prototype credentials</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            <div>Admin view: <code>admin@worqr.com</code> / any password</div>
            <div>Staff view: <code>staff@worqr.com</code> / any password</div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => fill('admin@worqr.com', 'Password1')}>
              Fill Admin
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => fill('staff@worqr.com', 'Password1')}>
              Fill Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
