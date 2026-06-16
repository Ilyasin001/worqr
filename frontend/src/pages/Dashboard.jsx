import { EVENTS, SHIFTS, STAFF, ASSIGNMENTS, PAYROLL_BATCHES, getEvent, getStaff, fmtDate, fmtTime, statusBadge, initials } from '../data/mockData.js'

const StatCard = ({ icon, label, value, change, changeType, bg, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className={`stat-change ${changeType === 'up' ? 'stat-up' : 'stat-down'}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  </div>
)

export default function Dashboard({ user }) {
  const upcoming = EVENTS.filter(e => e.status !== 'cancelled').slice(0, 4)
  const nextShifts = SHIFTS.slice(0, 4)
  const pendingPayroll = PAYROLL_BATCHES.filter(b => b.status !== 'paid').length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Good morning, {user.name.split(' ')[0]} 👋</h1>
          <p>Here's what's happening across your workforce today.</p>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stats-grid">
        <StatCard icon="👥" label="Total Staff"      value={STAFF.length}       change="2 this month"    changeType="up"   bg="#EDE9FE" />
        <StatCard icon="📅" label="Upcoming Events"  value={upcoming.length}    change="1 new this week" changeType="up"   bg="#DBEAFE" />
        <StatCard icon="🕐" label="Active Shifts"    value={SHIFTS.length}      change="from 4 last wk"  changeType="up"   bg="#D1FAE5" />
        <StatCard icon="💷" label="Pending Payroll"  value={pendingPayroll}     change="2 awaiting approval" changeType="down" bg="#FEF3C7" />
      </div>

      {/* ── LOWER GRID ── */}
      <div className="dash-grid">
        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Upcoming Events</div>
              <div className="card-subtitle">Next scheduled events</div>
            </div>
            <span className="badge badge-blue">{upcoming.length} events</span>
          </div>
          <div className="card-body" style={{ padding: '8px 20px' }}>
            {upcoming.map(ev => (
              <div className="event-row" key={ev._id}>
                <div
                  className="event-dot"
                  style={{ background: ev.status === 'confirmed' ? 'var(--success)' : ev.status === 'pending' ? 'var(--warning)' : 'var(--danger)' }}
                />
                <div className="event-info">
                  <div className="event-name">{ev.title}</div>
                  <div className="event-meta">📍 {ev.address}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div className="event-date">{fmtDate(ev.date)}</div>
                  <span className={`badge ${statusBadge(ev.status)}`}>{ev.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Shifts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Next Shifts</div>
            </div>
            <div className="card-body" style={{ padding: '8px 20px' }}>
              {nextShifts.map(sh => {
                const ev = getEvent(sh.eventId)
                const mgr = getStaff(sh.managerId)
                return (
                  <div className="shift-item" key={sh._id}>
                    <div className="shift-time-badge">{fmtTime(sh.startTime)}</div>
                    <div className="shift-info">
                      <div className="shift-event">{ev?.title}</div>
                      <div className="shift-manager">Mgr: {mgr?.name}</div>
                    </div>
                    <span className={`badge ${sh.confirmed ? 'badge-green' : 'badge-yellow'}`}>
                      {sh.confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Staff Overview</div>
            </div>
            <div className="card-body" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STAFF.slice(0, 4).map(s => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`avatar avatar-sm avatar-${s.color}`}>{initials(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>
                  </div>
                  <span className={`badge ${s.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{s.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
