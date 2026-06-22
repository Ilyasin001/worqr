import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { initials } from '../data/mockData.js'
import { resendVerification } from '../api/account.js'

const NAV = [
  { to: '/',            icon: '⊞', label: 'Dashboard'   },
  { to: '/events',      icon: '📅', label: 'Events'      },
  { to: '/shifts',      icon: '🕐', label: 'Shifts'      },
  { to: '/staff',       icon: '👥', label: 'Staff'       },
  { to: '/assignments', icon: '📋', label: 'Assignments' },
  { to: '/payroll',     icon: '💷', label: 'Payroll'     },
  { to: '/profile',     icon: '👤', label: 'My Profile'  },
]

const PAGE_TITLES = {
  '/':            'Dashboard',
  '/events':      'Events',
  '/shifts':      'Shifts',
  '/staff':       'Staff',
  '/assignments': 'Assignments',
  '/payroll':     'Payroll',
  '/profile':     'My Profile',
}

export default function Layout({ user, onLogout, children }) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'WORQR'

  const [verifyMsg, setVerifyMsg] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const resend = async () => {
    try {
      await resendVerification()
      setVerifyMsg('Verification email sent — check your inbox.')
    } catch (e) {
      setVerifyMsg(e.message)
    }
  }
  const showBanner = user.isVerified === false && !dismissed

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon">W</div>
            <span className="brand-name">WORQR</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Navigation</span>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className={`avatar avatar-purple`}>{initials(user.name)}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Log out">⏻</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-content">
        <header className="top-bar">
          <span className="page-title">{title}</span>
          <div className="top-bar-right">
            <span
              className={`badge role-badge-topbar ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}
            >
              {user.role}
            </span>
            <div className={`avatar avatar-sm avatar-purple`}>{initials(user.name)}</div>
          </div>
        </header>

        {showBanner && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#FEF3C7', color: '#92400E',
            padding: '10px 24px', fontSize: 13, borderBottom: '1px solid #FDE68A',
          }}>
            <span>✉️</span>
            <span style={{ flex: 1 }}>
              {verifyMsg || 'Please verify your email address to secure your account.'}
            </span>
            {!verifyMsg && (
              <button className="link-button" style={{ color: '#92400E' }} onClick={resend}>
                Resend email
              </button>
            )}
            <button className="link-button" style={{ color: '#92400E' }} onClick={() => setDismissed(true)}>
              Dismiss
            </button>
          </div>
        )}

        <div className="page-body">{children}</div>
      </div>
    </div>
  )
}
