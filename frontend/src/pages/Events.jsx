import { useState, useEffect } from 'react'
import { fmtDate, statusBadge } from '../data/mockData.js'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../api/events.js'

const EMPTY = { title: '', description: '', date: '', address: '', status: 'pending', capacity: '', notes: '' }

export default function Events({ user }) {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [modal, setModal]       = useState(null)   // null | 'create' | event obj
  const [form, setForm]         = useState(EMPTY)
  const [deleteId, setDeleteId] = useState(null)

  const isAdmin = user.role === 'admin'

  // Server-side search + status filter (debounced so typing doesn't spam the API).
  const load = (params) => getEvents(params).then(setEvents).catch(e => setError(e.message)).finally(() => setLoading(false))

  useEffect(() => {
    const t = setTimeout(() => load({ q: search, status: filter }), search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, filter])

  const visible = events

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = (ev) => { setForm({ ...EMPTY, ...ev, capacity: ev.capacity ?? '' }); setModal(ev) }
  const closeModal = () => { setModal(null); setForm(EMPTY) }

  const save = async () => {
    if (!form.title || !form.date) return
    const payload = { ...form, capacity: form.capacity === '' ? null : Number(form.capacity) }
    try {
      if (modal === 'create') {
        await createEvent(payload)
      } else {
        await updateEvent(modal._id, payload)
      }
      closeModal()
      load({ q: search, status: filter })
    } catch (e) {
      setError(e.message)
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteEvent(deleteId)
      setEvents(prev => prev.filter(e => e._id !== deleteId))
      setDeleteId(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Events</h1>
          <p>Manage all scheduled events and their status.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>＋ New Event</button>}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="toolbar" style={{ margin: 0, width: '100%' }}>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="toolbar-right">
              {['all','confirmed','pending','cancelled'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">
              <p>Loading events…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h3>No events found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Staffing</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map(ev => (
                  <tr key={ev._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ev.title}</div>
                      {ev.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{ev.description}</div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(ev.date)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{ev.address || '—'}</td>
                    <td>
                      {ev.capacity != null
                        ? <span className={`badge ${ev.filledCount >= ev.capacity ? 'badge-green' : 'badge-gray'}`}>{ev.filledCount ?? 0} / {ev.capacity}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{ev.filledCount ?? 0} staffed</span>}
                    </td>
                    <td><span className={`badge ${statusBadge(ev.status)}`}>{ev.status}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ev)}>✏️ Edit</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteId(ev._id)}>🗑 Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? 'Create Event' : 'Edit Event'}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Event title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Short description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Venue address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input className="form-input" type="number" min="0" placeholder="Staff needed" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows="3" placeholder="Internal notes (optional)" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title || !form.date}>
                {modal === 'create' ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">Delete Event</span>
              <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
