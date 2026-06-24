import { useState, useEffect } from 'react'
import { fmtDate, fmtTime } from '../data/mockData.js'
import { getShifts, getOpenShifts, claimShift, createShift, updateShift, deleteShift } from '../api/shifts.js'
import { getEvents } from '../api/events.js'
import { getStaff } from '../api/staff.js'

const EMPTY = { eventId: '', managerId: '', startTime: '', endTime: '', confirmed: false, repeatFreq: 'none', repeatCount: 4 }

export default function Shifts({ user }) {
  const [shifts, setShifts]   = useState([])
  const [events, setEvents]   = useState([])
  const [staff, setStaff]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [eventFilter, setEventFilter]       = useState('')
  const [confirmedFilter, setConfirmedFilter] = useState('all')
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(EMPTY)

  const isAdmin = user.role === 'admin'

  // Reference data (events, staff) loaded once.
  useEffect(() => {
    Promise.all([getEvents().catch(() => []), getStaff().catch(() => [])])
      .then(([ev, st]) => { setEvents(ev); setStaff(st) })
  }, [])

  // Admins see/manage all shifts (filtered); staff see only open shifts to claim.
  useEffect(() => {
    const params = {}
    if (eventFilter) params.eventId = eventFilter
    if (confirmedFilter !== 'all') params.confirmed = confirmedFilter
    const p = isAdmin ? getShifts(params) : getOpenShifts()
    p.then(setShifts).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [eventFilter, confirmedFilter, isAdmin])

  const claim = async (id) => {
    setError(null)
    try {
      await claimShift(id)
      setShifts(prev => prev.filter(s => s._id !== id)) // claimed → no longer open
    } catch (e) {
      setError(e.message)
    }
  }

  const visible = shifts.filter(s => {
    const ev = events.find(e => e._id === s.eventId)
    return !search || ev?.title.toLowerCase().includes(search.toLowerCase())
  })

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = (sh) => { setForm({ ...sh }); setModal(sh) }
  const closeModal = () => { setModal(null); setForm(EMPTY) }

  const save = async () => {
    if (!form.eventId || !form.managerId || !form.startTime || !form.endTime) return
    try {
      if (modal === 'create') {
        const payload = {
          eventId: form.eventId, managerId: form.managerId,
          startTime: form.startTime, endTime: form.endTime, confirmed: false,
        }
        if (form.repeatFreq && form.repeatFreq !== 'none') {
          payload.repeat = { frequency: form.repeatFreq, count: Number(form.repeatCount) || 1 }
        }
        const created = await createShift(payload)
        const arr = Array.isArray(created) ? created : [created]
        setShifts(prev => [...prev, ...arr])
      } else {
        const updated = await updateShift(modal._id, form)
        setShifts(prev => prev.map(s => s._id === modal._id ? updated : s))
      }
      closeModal()
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleConfirm = async (id) => {
    const shift = shifts.find(s => s._id === id)
    if (!shift) return
    try {
      const updated = await updateShift(id, { confirmed: !shift.confirmed })
      setShifts(prev => prev.map(s => s._id === id ? updated : s))
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteShift(id)
      setShifts(prev => prev.filter(s => s._id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

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
          <p>{isAdmin ? 'View and manage shifts assigned to events.' : 'Open shifts you can pick up.'}</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>＋ New Shift</button>}
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
            <input placeholder="Search by event…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isAdmin && (
              <>
                <select className="form-select" style={{ width: 'auto' }} value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                  <option value="">All events</option>
                  {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </select>
                <select className="form-select" style={{ width: 'auto' }} value={confirmedFilter} onChange={e => setConfirmedFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="true">Confirmed</option>
                  <option value="false">Pending</option>
                </select>
              </>
            )}
            <span className="badge badge-blue">{visible.length} shifts</span>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><p>Loading shifts…</p></div>
          ) : (
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
                  <th>{isAdmin ? 'Actions' : 'Claim'}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(sh => {
                  const ev  = events.find(e => e._id === sh.eventId)
                  const mgr = staff.find(s => s._id === sh.managerId)
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
                      <td>
                        {isAdmin ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => toggleConfirm(sh._id)}>
                              {sh.confirmed ? '⏸ Unconfirm' : '✓ Confirm'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(sh)}>✏️</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(sh._id)}>🗑</button>
                          </div>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => claim(sh._id)}>＋ Claim</button>
                        )}
                      </td>
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
              <span className="modal-title">{modal === 'create' ? 'Create Shift' : 'Edit Shift'}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Event *</label>
                <select className="form-select" value={form.eventId} onChange={e => setForm(f => ({...f, eventId: e.target.value}))}>
                  <option value="">Select event…</option>
                  {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Manager *</label>
                <select className="form-select" value={form.managerId} onChange={e => setForm(f => ({...f, managerId: e.target.value}))}>
                  <option value="">Select manager…</option>
                  {staff.filter(s => s.role === 'admin').map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
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
              {modal === 'create' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Repeat</label>
                    <select className="form-select" value={form.repeatFreq} onChange={e => setForm(f => ({...f, repeatFreq: e.target.value}))}>
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  {form.repeatFreq !== 'none' && (
                    <div className="form-group">
                      <label className="form-label">Occurrences</label>
                      <input className="form-input" type="number" min="1" max="60" value={form.repeatCount} onChange={e => setForm(f => ({...f, repeatCount: e.target.value}))} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.eventId || !form.managerId || !form.startTime || !form.endTime}>
                {modal === 'create' ? 'Create Shift' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
