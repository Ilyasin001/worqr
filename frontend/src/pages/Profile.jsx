import { useState } from 'react'
import { updateMe, changePassword, resendVerification } from '../api/account.js'

export default function Profile({ user, onUserUpdate }) {
  const [name, setName]       = useState(user.name || '')
  const [address, setAddress] = useState(user.address || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg]     = useState(null)

  const [resendMsg, setResendMsg] = useState(null)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const updated = await updateMe({ name, address })
      onUserUpdate?.(updated)
      setProfileMsg({ ok: true, text: 'Profile updated.' })
    } catch (err) {
      setProfileMsg({ ok: false, text: err.message })
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (next !== confirm) { setPwMsg({ ok: false, text: 'New passwords do not match.' }); return }
    setSavingPw(true)
    setPwMsg(null)
    try {
      await changePassword(current, next)
      setCurrent(''); setNext(''); setConfirm('')
      setPwMsg({ ok: true, text: 'Password updated.' })
    } catch (err) {
      setPwMsg({ ok: false, text: err.message })
    } finally {
      setSavingPw(false)
    }
  }

  const resend = async () => {
    setResendMsg(null)
    try {
      await resendVerification()
      setResendMsg({ ok: true, text: 'Verification email sent — check your inbox (or the server console in development).' })
    } catch (err) {
      setResendMsg({ ok: false, text: err.message })
    }
  }

  const banner = (m) => m && (
    <div style={{
      background: m.ok ? '#ECFDF5' : '#FEF2F2',
      color: m.ok ? '#065F46' : '#991B1B',
      borderRadius: 6, padding: '8px 12px', fontSize: 13, marginTop: 12,
    }}>{m.text}</div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Profile</h1>
          <p>Manage your account details and password.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20, maxWidth: 560 }}>
        {/* Account details */}
        <div className="card">
          <div className="card-header"><div className="card-title">Account details</div></div>
          <div className="card-body" style={{ padding: 20 }}>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user.email} disabled />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  {user.isVerified
                    ? <span className="badge badge-green">✓ Verified</span>
                    : <>
                        <span className="badge badge-yellow">Unverified</span>
                        <button type="button" className="link-button" onClick={resend}>Resend verification</button>
                      </>}
                </div>
                {banner(resendMsg)}
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Optional" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
              {banner(profileMsg)}
            </form>
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-header"><div className="card-title">Change password</div></div>
          <div className="card-body" style={{ padding: 20 }}>
            <form onSubmit={savePassword}>
              <div className="form-group">
                <label className="form-label">Current password</label>
                <input className="form-input" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input className="form-input" type="password" value={next} onChange={e => setNext(e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  At least 8 characters, with an uppercase letter, lowercase letter, and number.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input className="form-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPw}>
                {savingPw ? 'Updating…' : 'Update password'}
              </button>
              {banner(pwMsg)}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
