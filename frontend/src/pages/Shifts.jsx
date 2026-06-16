import { useState } from 'react'
import { SHIFTS, EVENTS, STAFF, getEvent, getStaff, fmtDate, fmtTime } from '../data/mockData.js'

const EMPTY = { eventId: '', managerId: '', startTime: '', endTime: '', confirmed: false }

export default function Shifts({ user }) {
  const [shifts, setShifts]     = useState(SHIFTS)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY)

  const isAdmin = user.role === 'admin'

  const visible = shifts.filter(s => {
    const ev = getEvent(s.eventId)
    return !search || ev?.title.toLowerCase().includes(search.toLowerCase())
  })

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = (sh) => { setForm({ ...sh }); setModal(sh) }
  const closeModal = () => { setModal(null); setForm(EMPTY) }

  const save = () => {
    if (!form.eventId || !form.startTime || !form.endTime) return
    if (modal === 'create') {
      setShifts(prev => [...prev, { ...form, _id: `sh${Date.now()}`, confirmed: false }])
    } else {
      setShifts(prev => prev.map(s => s._id === modal._id ? { ...s, ...form } : s))
    }
    closeModal()
  }

  const toggleConfirm = (id) => {
    setShifts(prev => prev.map(s => s._id === id ? { ...s, confirmed: !s.confirmed } : s))
  }

  const deleteShift = (id) => setShifts(prev => prev.filter(s => s._id !== id))

  const duration = (start, end) => {
    if (!start || !end) return '—'
    const hrs = (new Date(end) - new Date(start)) / 3600000
    return `${hrs}h`
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Shifts</h1>
          <p>View and manage shifts assigned to events.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>＋ New Shift</button>}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{ margin: 0 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Search by event…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="badge badge-blue">{visible.length} shifts</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Manager</th>
                <th>Date</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map(sh => {
                const ev  = getEvent(sh.eventId)
                const mgr = getStaff(sh.managerId)
                return (
                  <tr key={sh._id}>
                    <td style={{ fontWeight: 500 }}>{ev?.title || '—'}</td>
                    <td>{mgr?.name || '—'}</td>
                    <td>{fmtDate(sh.startTime)}</td>
                    <td><span className="tag">{fmtTime(sh.startTime)}</span></td>
                    <td><span className="tag">{fmtTime(sh.endTime)}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{duration(sh.startTime, sh.endTime)}</td>
                    <td>
                      <span className={`badge ${sh.confirmed ? 'badge-green' : 'badge-yellow'}`}>
                        {sh.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => toggleConfirm(sh._id)}>
                            {sh.confirmed ? '⏸ Unconfirm' : '✓ Confirm'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(sh)}>✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteShift(sh._id)}>🗑</button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? 'Create Shift' : 'Edit Shift'}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Event *</label>
                <select className="form-select" value={form.eventId} onChange={e => setForm(f => ({...f, eventId: e.target.value}))}>
                  <option value="">Select event…</option>
                  {EVENTS.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Manager</label>
                <select className="form-select" value={form.managerId} onChange={e => setForm(f => ({...f, managerId: e.target.value}))}>
                  <option value="">Select manager…</option>
                  {STAFF.filter(s => s.role === 'admin').map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input className="form-input" type="datetime-local" value={form.startTime?.slice(0,16) || ''} onChange={e => setForm(f => ({...f, startTime: e.target.value + ':00Z'}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input className="form-input" type="datetime-local" value={form.endTime?.slice(0,16) || ''} onChange={e => setForm(f => ({...f, endTime: e.target.value + ':00Z'}))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.eventId || !form.startTime || !form.endTime}>
                {modal === 'create' ? 'Create Shift' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
