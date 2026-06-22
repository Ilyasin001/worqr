import { useState, useEffect } from 'react'
import { initials } from '../data/mockData.js'
import { getStaff, createStaff, updateStaff, deleteStaff } from '../api/staff.js'
import { getMyCompany, rotateCode } from '../api/company.js'

const COLORS = ['indigo','blue','green','orange','pink','teal','red','purple']
const EMPTY  = { name: '', email: '', role: 'staff', hourlyRate: 12.00, password: '' }

export default function Staff({ user }) {
  const [staff, setStaff]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(EMPTY)

  const isAdmin = user.role === 'admin'
  const [company, setCompany] = useState(null)

  useEffect(() => {
    getStaff()
      .then(setStaff)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (isAdmin) getMyCompany().then(setCompany).catch(() => {})
  }, [isAdmin])

  const handleRotate = async () => {
    if (!window.confirm('Rotate the join code? The current code will stop working.')) return
    try {
      const { code } = await rotateCode()
      setCompany(c => ({ ...c, code }))
    } catch (e) {
      setError(e.message)
    }
  }

  const visible = staff.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = (s)  => { setForm({ ...s, password: '' }); setModal(s) }
  const closeModal = () => { setModal(null); setForm(EMPTY) }

  const save = async () => {
    if (!form.name || !form.email) return
    try {
      if (modal === 'create') {
        const created = await createStaff({ ...form })
        setStaff(prev => [...prev, { ...created, color: COLORS[prev.length % COLORS.length] }])
      } else {
        const { name, email, role, hourlyRate } = form
        const updated = await updateStaff(modal._id, { name, email, role, hourlyRate })
        setStaff(prev => prev.map(s => s._id === modal._id ? { ...s, ...updated } : s))
      }
      closeModal()
    } catch (e) {
      setError(e.message)
    }
  }

  const del = async (id) => {
    try {
      await deleteStaff(id)
      setStaff(prev => prev.filter(s => s._id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  const admins = visible.filter(s => s.role === 'admin')
  const crew   = visible.filter(s => s.role === 'staff')

  const Section = ({ title, members }) => (
    members.length > 0 && (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          {title} ({members.length})
        </div>
        <div className="staff-grid">
          {members.map((s, index) => (
            <div className="staff-card" key={s._id}>
              <div className={`staff-card-avatar avatar-${s.color || COLORS[index % COLORS.length]}`}>{initials(s.name)}</div>
              <div className="staff-card-name">{s.name}</div>
              <div className="staff-card-email">{s.email}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${s.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{s.role}</span>
                <span className="staff-card-rate">£{Number(s.hourlyRate).toFixed(2)}/hr</span>
              </div>
              {isAdmin && (
                <div className="staff-card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️ Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(s._id)}>🗑</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Staff</h1>
          <p>{staff.length} team members · {staff.filter(s => s.role === 'admin').length} admins</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>＋ Add Staff</button>}
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {isAdmin && company?.code && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Company join code
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Share this with new staff so they can register under {company.name}.
              </div>
            </div>
            <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: '2px', background: 'var(--bg)', padding: '6px 14px', borderRadius: 6 }}>
              {company.code}
            </code>
            <button className="btn btn-secondary btn-sm" onClick={handleRotate}>🔄 Rotate</button>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-right">
          <span className="badge badge-gray">{visible.length} results</span>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state"><p>Loading staff…</p></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No staff found</h3>
            <p>Try adjusting your search.</p>
          </div>
        </div>
      ) : (
        <>
          <Section title="Administrators" members={admins} />
          <Section title="Staff" members={crew} />
        </>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? 'Add Staff Member' : 'Edit Staff Member'}</span>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="jane@worqr.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              </div>
              {modal === 'create' && (
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hourly Rate (£)</label>
                  <input className="form-input" type="number" step="0.50" min="0" value={form.hourlyRate} onChange={e => setForm(f => ({...f, hourlyRate: parseFloat(e.target.value) || 0}))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.name || !form.email}>
                {modal === 'create' ? 'Add Member' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
