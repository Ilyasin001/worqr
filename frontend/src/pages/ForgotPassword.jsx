import { useState } from 'react'
import { forgotPassword } from '../api/account.js'

export default function ForgotPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email.'); return }
    setSubmitting(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
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

        <h2 className="login-title">Reset your password</h2>
        <p className="login-subtitle">We'll email you a link to set a new password.</p>

        {sent ? (
          <div style={{ background: '#ECFDF5', color: '#065F46', borderRadius: 6, padding: '12px 14px', fontSize: 13 }}>
            If that email is registered, a reset link is on its way. Check your inbox (and, in development, the server console).
          </div>
        ) : (
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

            {error && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link →'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <button type="button" className="link-button" onClick={onSwitchToLogin}>Back to sign in</button>
        </p>
      </div>
    </div>
  )
}
