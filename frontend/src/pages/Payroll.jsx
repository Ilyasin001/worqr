import { useState } from 'react'
import { PAYROLL_BATCHES, STAFF, getStaff, fmtDate, statusBadge, initials } from '../data/mockData.js'

const STATUS_ORDER = ['draft', 'approved', 'paid']

export default function Payroll({ user }) {
  const [batches, setBatches] = useState(PAYROLL_BATCHES)
  const [tab, setTab]         = useState(user.role === 'admin' ? 'all' : 'mine')
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ staffId: '', periodStart: '', periodEnd: '' })

  const isAdmin = user.role === 'admin'

  const visible = tab === 'mine'
    ? batches.filter(b => b.staff === 's2') // simulate current staff
    : batches

  const advance = (id) => {
    setBatches(prev => prev.map(b => {
      if (b._id !== id) return b
      const next = STATUS_ORDER[STATUS_ORDER.indexOf(b.status) + 1]
      return next ? { ...b, status: next, processedAt: new Date().toISOString().slice(0,10) } : b
    }))
  }

  const createDraft = () => {
    if (!form.staffId || !form.periodStart || !form.periodEnd) return
    const staff = getStaff(form.staffId)
    setBatches(prev => [...prev, {
      _id: `pb${Date.now()}`,
      staff: form.staffId,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      totalHours: 0,
      totalPay: 0,
      assignments: [],
      status: 'draft',
      processedAt: null,
    }])
    setModal(false)
    setForm({ staffId: '', periodStart: '', periodEnd: '' })
  }

  const statusLabel = (s) => ({ draft: 'Draft', approved: 'Approved', paid: 'Paid' }[s] || s)

  const Pipeline = ({ current }) => (
    <div className="payroll-pipeline">
      {STATUS_ORDER.map((step, i) => {
        const idx = STATUS_ORDER.indexOf(current)
        const cls = i < idx ? 'pipeline-done' : i === idx ? 'pipeline-active' : 'pipeline-inactive'
        return [
          i > 0 && <span key={`arr${i}`} className="pipeline-arrow">›</span>,
          <div key={step} className={`pipeline-step ${cls}`}>
            {i < idx ? '✓ ' : ''}{statusLabel(step)}
          </div>
        ]
      })}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Payroll</h1>
          <p>Track, approve, and finalise staff payroll batches.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setModal(true)}>＋ New Draft</button>}
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {isAdmin && (
          <button
            onClick={() => setTab('all')}
            className="btn btn-ghost"
            style={{ borderBottom: tab === 'all' ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, color: tab === 'all' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}
          >
            All Batches
          </button>
        )}
        <button
          onClick={() => setTab('mine')}
          className="btn btn-ghost"
          style={{ borderBottom: tab === 'mine' ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: 0, color: tab === 'mine' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}
        >
          My Pay History
        </button>
      </div>

      {/* ── SUMMARY STATS (admin) ── */}
      {isAdmin && tab === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Batches', value: batches.length, icon: '📦', bg: '#EDE9FE' },
            { label: 'Total Hours', value: `${batches.reduce((s,b) => s + b.totalHours, 0).toFixed(1)}h`, icon: '⏱', bg: '#DBEAFE' },
            { label: 'Total Pay', value: `£${batches.reduce((s,b) => s + b.totalPay, 0).toFixed(2)}`, icon: '💷', bg: '#D1FAE5' },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="stat-icon" style={{ background: bg, width: 40, height: 40 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BATCH LIST ── */}
      {visible.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💷</div>
            <h3>No payroll batches</h3>
            <p>{isAdmin ? 'Create a new draft to get started.' : 'No paid batches yet.'}</p>
          </div>
        </div>
      ) : (
        <div className="batch-list">
          {visible.map(b => {
            const staff  = getStaff(b.staff)
            const canAdv = isAdmin && b.status !== 'paid'
            return (
              <div className="payroll-batch" key={b._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div className={`avatar avatar-${staff?.color || 'blue'}`}>{staff ? initials(staff.name) : '?'}</div>
                  <div className="batch-info">
                    <div className="batch-name">{staff?.name || 'Unknown Staff'}</div>
                    <div className="batch-meta">
                      {fmtDate(b.periodStart)} – {fmtDate(b.periodEnd)}
                      {b.processedAt && ` · Processed ${fmtDate(b.processedAt)}`}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Pipeline current={b.status} />
                    </div>
                  </div>
                </div>

                <div className="batch-amounts">
                  <div className="amount-block">
                    <div className="amount-value">{b.totalHours.toFixed(1)}h</div>
                    <div className="amount-label">Hours</div>
                  </div>
                  <div className="amount-block">
                    <div className="amount-value" style={{ color: 'var(--success)' }}>£{b.totalPay.toFixed(2)}</div>
                    <div className="amount-label">Total Pay</div>
                  </div>
                  <div className="amount-block">
                    <div className="amount-value">{b.assignments.length}</div>
                    <div className="amount-label">Assignments</div>
                  </div>
                </div>

                <div className="batch-actions">
                  <span className={`badge ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span>
                  {canAdv && (
                    <button
                      className={`btn btn-sm ${b.status === 'approved' ? 'btn-success' : 'btn-primary'}`}
                      onClick={() => advance(b._id)}
                    >
                      {b.status === 'draft' ? '✓ Approve' : '💷 Finalise'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── New Draft Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Create Payroll Draft</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Staff Member *</label>
                <select className="form-select" value={form.staffId} onChange={e => setForm(f => ({...f, staffId: e.target.value}))}>
                  <option value="">Select staff…</option>
                  {STAFF.filter(s => s.role === 'staff').map(s => (
                    <option key={s._id} value={s._id}>{s.name} — £{s.hourlyRate}/hr</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Period Start *</label>
                  <input className="form-input" type="date" value={form.periodStart} onChange={e => setForm(f => ({...f, periodStart: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Period End *</label>
                  <input className="form-input" type="date" value={form.periodEnd} onChange={e => setForm(f => ({...f, periodEnd: e.target.value}))} />
                </div>
              </div>
              <div style={{ background: 'var(--info-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: '#1D4ED8' }}>
                ℹ️ The draft will be created with calculated hours and pay from unpaid assignments in this period.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createDraft} disabled={!form.staffId || !form.periodStart || !form.periodEnd}>
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
