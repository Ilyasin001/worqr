import { useState, useEffect } from 'react'
import { fmtDate, fmtTime, statusBadge, initials } from '../data/mockData.js'
import { getEvents } from '../api/events.js'
import { getShifts } from '../api/shifts.js'
import { getStaff } from '../api/staff.js'
import { getBatches } from '../api/payroll.js'

const COLORS = ['indigo','blue','green','orange','pink','teal','red','purple']

const StatCard = ({ icon, label, value, change, changeType, bg, fg }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg, color: fg }}>
      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
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
  const [events, setEvents]   = useState([])
  const [shifts, setShifts]   = useState([])
  const [staff, setStaff]     = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getEvents().catch(() => []),
      getShifts().catch(() => []),
      getStaff().catch(() => []),
      getBatches().catch(() => []),
    ]).then(([ev, sh, st, bt]) => {
      setEvents(ev)
      setShifts(sh)
      setStaff(st)
      setBatches(bt)
    }).finally(() => setLoading(false))
  }, [])

  const upcoming      = events.filter(e => e.status !== 'cancelled').slice(0, 4)
  const nextShifts    = shifts.slice(0, 4)
  const pendingPayroll = batches.filter(b => b.status !== 'paid').length

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1>Good morning, {user.name.split(' ')[0]} 👋</h1>
            <p>Loading dashboard data…</p>
          </div>
        </div>
      </div>
    )
  }

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
        <StatCard icon="group"    label="Total Staff"     value={staff.length}    change="2 this month"        changeType="up"   bg="#e1e0ff" fg="#2f2ebe" />
        <StatCard icon="event"    label="Upcoming Events" value={upcoming.length} change="1 new this week"     changeType="up"   bg="#dce9ff" fg="#1d4ed8" />
        <StatCard icon="schedule" label="Active Shifts"   value={shifts.length}   change="from 4 last wk"      changeType="up"   bg="#d7f1ec" fg="#00504a" />
        <StatCard icon="payments" label="Pending Payroll" value={pendingPayroll}  change="2 awaiting approval" changeType="down" bg="#f7ecd3" fg="#6b4a00" />
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
                  <div className="event-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>location_on</span>
                    {ev.address}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div className="event-date">{fmtDate(ev.date)}</div>
                  <span className={`badge ${statusBadge(ev.status)}`}>{ev.status}</span>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>No upcoming events.</div>
            )}
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
                const ev  = events.find(e => e._id === sh.eventId)
                const mgr = staff.find(s => s._id === sh.managerId)
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
              {nextShifts.length === 0 && (
                <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>No upcoming shifts.</div>
              )}
            </div>
          </div>

          {/* Staff Overview */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Staff Overview</div>
            </div>
            <div className="card-body" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {staff.slice(0, 4).map((s, index) => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`avatar avatar-sm avatar-${s.color || COLORS[index % COLORS.length]}`}>{initials(s.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>
                  </div>
                  <span className={`badge ${s.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{s.role}</span>
                </div>
              ))}
              {staff.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No staff found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
