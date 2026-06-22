import { useState } from 'react'
import { register, registerCompany } from '../api/auth.js'

export default function Register({ onAuth, onSwitchToLogin }) {
  const [mode, setMode] = useState('create') // 'create' | 'join'
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password) {
      setError('Please fill in your name, email, and password.')
      return
    }
    if (mode === 'create' && !companyName) {
      setError('Please enter a company name.')
      return
    }
    if (mode === 'join' && !companyCode) {
      setError('Please enter your company code.')
      return
    }

    setSubmitting(true)
    try {
      const res = mode === 'create'
        ? await registerCompany(companyName, name, email, password)
        : await register(name, email, password, companyCode.trim().toUpperCase())
      onAuth(res)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">W</div>
          <span className="login-logo-text">WORQR</span>
        </div>

        <h2 className="login-title">{mode === 'create' ? 'Create your company' : 'Join your company'}</h2>
        <p className="login-subtitle">
          {mode === 'create'
            ? 'Set up a new workspace — you’ll be the admin.'
            : 'Enter the company code your admin shared with you.'}
        </p>

        {/* mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('create'); setError('') }}
          >
            Create a company
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'join' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('join'); setError('') }}
          >
            Join with a code
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'create' ? (
            <div className="form-group">
              <label className="form-label">Company name</label>
              <input
                className="form-input"
                placeholder="Acme Events Ltd"
                value={companyName}
                onChange={e => { setCompanyName(e.target.value); setError('') }}
                autoFocus
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Company code</label>
              <input
                className="form-input"
                placeholder="WQ7K2P9X"
                value={companyCode}
                onChange={e => { setCompanyCode(e.target.value); setError('') }}
                style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Your name</label>
            <input
              className="form-input"
              placeholder="Jane Smith"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
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
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              At least 8 characters, with an uppercase letter, lowercase letter, and number.
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? 'Creating…' : (mode === 'create' ? 'Create company →' : 'Join company →')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
