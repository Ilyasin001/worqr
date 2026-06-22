import { useState } from 'react'
import { resetPassword } from '../api/account.js'

export default function ResetPassword({ token, onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) { setError('Please enter a new password.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    setError('')
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not reset your password. The link may have expired.')
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

        <h2 className="login-title">Choose a new password</h2>

        {!token ? (
          <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '12px 14px', fontSize: 13 }}>
            This reset link is missing its token. Please use the link from your email.
          </div>
        ) : done ? (
          <>
            <div style={{ background: '#ECFDF5', color: '#065F46', borderRadius: 6, padding: '12px 14px', fontSize: 13, marginBottom: 16 }}>
              Your password has been reset.
            </div>
            <button className="login-btn" onClick={onDone}>Continue to sign in →</button>
          </>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); setError('') }} autoFocus />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                At least 8 characters, with an uppercase letter, lowercase letter, and number.
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }} />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
