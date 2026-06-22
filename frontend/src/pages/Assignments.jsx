import { useState, useEffect } from 'react'
import { fmtDateTime } from '../data/mockData.js'
import { getAssignments, createAssignment, updateAssignment, updateAssignmentStatus, deleteAssignment } from '../api/assignments.js'

const STATUS_BADGE = { assigned: 'badge-yellow', confirmed: 'badge-green', declined: 'badge-gray', cancelled: 'badge-gray' }
import { getShifts } from '../api/shifts.js'
import { getStaff } from '../api/staff.js'
import { getEvents } from '../api/events.js'

const EMPTY = { shiftId: '', staffId: '', hourlyRate: 12.00, breakDuration: 30 }

export default function Assignments({ user }) {
  const [assignments, setAssignments] = useState([])
  const [shifts, setShifts]           = useState([])
  const [staff, setStaff]             = useState([])
  const [events, setEvents]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState(null)
  const [form, setForm]               = useState(EMPTY)

  const isAdmin = user.role === 'admin'

  useEffect(() => {
    Promise.all([
      getAssignments().catch(() => []),
      getShifts().catch(() => []),
      getStaff().catch(() => []),
      getEvents().catch(() => []),
    ])
      .then(([a, sh, st, ev]) => {
        setAssignments(a)
        setShifts(sh)
        setStaff(st)
        setEvents(ev)
      })
      .finally(() => setLoading(false))
  }, [])

  const visible = assignments.filter(a => {
    if (!search) return true
    const shift = shifts.find(s => s._id === a.shiftId)
    const ev    = shift ? events.find(e => e._id === shift.eventId) : null
    const member = staff.find(s => s._id === a.staffId)
    return (
      ev?.title.toLowerCase().includes(search.toLowerCase()) ||
      member?.name.toLowerCase().includes(search.toLowerCase())
    )
  })

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = (a) => { setForm({ ...a }); setModal(a) }
  const closeModal = () => { setModal(null); setForm(EMPTY) }

  const save = async () => {
    if (!form.shiftId || !form.staffId) return
    try {
      if (modal === 'create') {
        const created = await createAssignment({ ...form, isPaid: false, actualStartTime: null, actualEndTime: null })
        setAssignments(prev => [...prev, created])
      } else {
        const updated = await updateAssignment(modal._id, form)
        setAssignments(prev => prev.map(a => a._id === modal._id ? updated : a))
      }
      closeModal()
    } catch (e) {
      setError(e.message)
    }
  }

  const del = async (id) => {
    try {
      await deleteAssignment(id)
      setAssignments(prev => prev.filter(a => a._id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  const changeStatus = async (id, status) => {
    setError(null)
    try {
      const updated = await updateAssignmentStatus(id, status)
      setAssignments(prev => prev.map(a => a._id === id ? { ...a, ...updated } : a))
    } catch (e) {
      setError(e.message)
    }
  }

  const calcHours = (a) => {
    if (!a.actualStartTime || !a.actualEndTime) return null
    const hrs = (new Date(a.actualEndTime) - new Date(a.actualStartTime)) / 3600000 - (a.breakDuration / 60)
    return Math.max(0, hrs).toFixed(1)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Assignments</h1>
          <p>Staff assigned to shifts across all events.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>＋ Assign Staff</button>}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{ margin: 0 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Search by event or staff…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="badge badge-blue">{visible.length} assignments</span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><p>Loading assignments…</p></div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No assignments found</h3>
              <p>Try adjusting your search.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Event</th>
                  <th>Shift</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Actual Hours</th>
                  <th>Payment</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map(a => {
                  const shift  = shifts.find(s => s._id === a.shiftId)
                  const ev     = shift ? events.find(e => e._id === shift.eventId) : null
                  const member = staff.find(s => s._id === a.staffId)
                  const hours  = calcHours(a)
                  return (
                    <tr key={a._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={`avatar avatar-sm avatar-${member?.color || 'blue'}`}>
                            {member ? member.name.split(' ').map(n => n[0]).join('') : '?'}
                          </div>
                          <span style={{ fontWeight: 500 }}>{member?.name || '—'}</span>
                        </div>
                      </td>
                      <td>{ev?.title || '—'}</td>
                      <td>
                        {shift ? (
                          <span className="tag">
                            {new Date(shift.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                            {' – '}
                            {new Date(shift.endTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>£{Number(a.hourlyRate).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{a.status || 'assigned'}</span>
                          {isAdmin ? (
                            <select
                              className="form-select"
                              style={{ padding: '2px 4px', fontSize: 11, height: 'auto' }}
                              value={a.status || 'assigned'}
                              onChange={e => changeStatus(a._id, e.target.value)}
                            >
                              <option value="assigned">assigned</option>
                              <option value="confirmed">confirmed</option>
                              <option value="declined">declined</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                          ) : (a.staffId === user._id && ['assigned'].includes(a.status || 'assigned')) ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => changeStatus(a._id, 'confirmed')}>Confirm</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(a._id, 'declined')}>Decline</button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {hours
                          ? <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{hours}h</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not clocked</span>
                        }
                      </td>
                      <td>
                        <span className={`badge ${a.isPaid ? 'badge-green' : 'badge-gray'}`}>
                          {a.isPaid ? '✓ Paid' : 'Unpaid'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>✏️</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(a._id)}>🗑</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? 'Assign Staff to Shift' : 'Edit Assignment'}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Shift *</label>
                <select className="form-select" value={form.shiftId} onChange={e => setForm(f => ({...f, shiftId: e.target.value}))}>
                  <option value="">Select shift…</option>
                  {shifts.map(sh => {
                    const ev = events.find(e => e._id === sh.eventId)
                    return (
                      <option key={sh._id} value={sh._id}>
                        {ev?.title} – {new Date(sh.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Staff Member *</label>
                <select className="form-select" value={form.staffId} onChange={e => {
                  const s = staff.find(m => m._id === e.target.value)
                  setForm(f => ({...f, staffId: e.target.value, hourlyRate: s?.hourlyRate || 12}))
                }}>
                  <option value="">Select staff…</option>
                  {staff.filter(s => s.role === 'staff').map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hourly Rate (£)</label>
                  <input className="form-input" type="number" step="0.50" min="0" value={form.hourlyRate} onChange={e => setForm(f => ({...f, hourlyRate: parseFloat(e.target.value) || 0}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Break (mins)</label>
                  <input className="form-input" type="number" min="0" value={form.breakDuration} onChange={e => setForm(f => ({...f, breakDuration: parseInt(e.target.value) || 0}))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.shiftId || !form.staffId}>
                {modal === 'create' ? 'Assign' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
