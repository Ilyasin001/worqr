import { NavLink, useLocation } from 'react-router-dom'
import { initials } from '../data/mockData.js'

const NAV = [
  { to: '/',            icon: '⊞', label: 'Dashboard'   },
  { to: '/events',      icon: '📅', label: 'Events'      },
  { to: '/shifts',      icon: '🕐', label: 'Shifts'      },
  { to: '/staff',       icon: '👥', label: 'Staff'       },
  { to: '/assignments', icon: '📋', label: 'Assignments' },
  { to: '/payroll',     icon: '💷', label: 'Payroll'     },
]

const PAGE_TITLES = {
  '/':            'Dashboard',
  '/events':      'Events',
  '/shifts':      'Shifts',
  '/staff':       'Staff',
  '/assignments': 'Assignments',
  '/payroll':     'Payroll',
}

export default function Layout({ user, onLogout, children }) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'WORQR'

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

        <div className="page-body">{children}</div>
      </div>
    </div>
  )
}
