import { useState, useEffect } from 'react'
import { verifyEmail } from '../api/account.js'

export default function VerifyEmail({ token, onDone }) {
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setMessage(err.message || 'This verification link is invalid or has expired.')
      })
  }, [token])

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">W</div>
          <span className="login-logo-text">WORQR</span>
        </div>

        <h2 className="login-title">Email verification</h2>

        {status === 'verifying' && (
          <p className="login-subtitle">Verifying your email…</p>
        )}

        {status === 'success' && (
          <>
            <div style={{ background: '#ECFDF5', color: '#065F46', borderRadius: 6, padding: '12px 14px', fontSize: 13, marginBottom: 16 }}>
              Your email has been verified. Thanks!
            </div>
            <button className="login-btn" onClick={onDone}>Continue →</button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '12px 14px', fontSize: 13, marginBottom: 16 }}>
              {message}
            </div>
            <button className="login-btn" onClick={onDone}>Continue →</button>
          </>
        )}
      </div>
    </div>
  )
}
