export const STAFF = [
  { _id: 's1', name: 'Alice Johnson',  email: 'alice@worqr.com',   role: 'admin', hourlyRate: 20.00, color: 'indigo' },
  { _id: 's2', name: 'Bob Smith',      email: 'bob@worqr.com',     role: 'staff', hourlyRate: 13.50, color: 'blue'   },
  { _id: 's3', name: 'Carol White',    email: 'carol@worqr.com',   role: 'staff', hourlyRate: 12.00, color: 'green'  },
  { _id: 's4', name: 'David Brown',    email: 'david@worqr.com',   role: 'staff', hourlyRate: 14.00, color: 'orange' },
  { _id: 's5', name: 'Emma Davis',     email: 'emma@worqr.com',    role: 'staff', hourlyRate: 12.50, color: 'pink'   },
  { _id: 's6', name: 'Frank Wilson',   email: 'frank@worqr.com',   role: 'staff', hourlyRate: 13.00, color: 'teal'   },
  { _id: 's7', name: 'Grace Lee',      email: 'grace@worqr.com',   role: 'staff', hourlyRate: 11.50, color: 'red'    },
  { _id: 's8', name: 'Henry Taylor',   email: 'henry@worqr.com',   role: 'staff', hourlyRate: 12.50, color: 'purple' },
]

export const EVENTS = [
  { _id: 'e1', title: 'Summer Music Festival',    description: 'Outdoor festival with 3 stages', date: '2026-06-15', address: 'Hyde Park, London',          status: 'confirmed', createdBy: 's1' },
  { _id: 'e2', title: 'Corporate Conference 2026', description: 'Annual business summit',          date: '2026-07-20', address: 'ExCeL London',                status: 'pending',   createdBy: 's1' },
  { _id: 'e3', title: 'Wedding Gala',              description: 'Black-tie reception and dinner',  date: '2026-05-30', address: 'The Ritz, London',            status: 'confirmed', createdBy: 's1' },
  { _id: 'e4', title: 'Product Launch Event',      description: 'Tech product reveal evening',     date: '2026-08-10', address: '30 St Mary Axe, London',     status: 'pending',   createdBy: 's1' },
  { _id: 'e5', title: 'Charity Fundraiser',        description: 'Annual gala for local charities', date: '2026-09-05', address: 'Guildhall, London',           status: 'cancelled', createdBy: 's1' },
]

export const SHIFTS = [
  { _id: 'sh1', eventId: 'e1', managerId: 's1', startTime: '2026-06-15T08:00:00Z', endTime: '2026-06-15T14:00:00Z', confirmed: true  },
  { _id: 'sh2', eventId: 'e1', managerId: 's1', startTime: '2026-06-15T14:00:00Z', endTime: '2026-06-15T22:00:00Z', confirmed: true  },
  { _id: 'sh3', eventId: 'e2', managerId: 's1', startTime: '2026-07-20T09:00:00Z', endTime: '2026-07-20T17:00:00Z', confirmed: false },
  { _id: 'sh4', eventId: 'e2', managerId: 's4', startTime: '2026-07-20T17:00:00Z', endTime: '2026-07-20T23:00:00Z', confirmed: false },
  { _id: 'sh5', eventId: 'e3', managerId: 's1', startTime: '2026-05-30T16:00:00Z', endTime: '2026-05-30T23:59:00Z', confirmed: true  },
  { _id: 'sh6', eventId: 'e4', managerId: 's4', startTime: '2026-08-10T17:00:00Z', endTime: '2026-08-10T22:00:00Z', confirmed: false },
]

export const ASSIGNMENTS = [
  { _id: 'a1', shiftId: 'sh1', staffId: 's2', hourlyRate: 13.50, breakDuration: 30, actualStartTime: '2026-06-15T08:05:00Z', actualEndTime: '2026-06-15T14:00:00Z', isPaid: false },
  { _id: 'a2', shiftId: 'sh1', staffId: 's3', hourlyRate: 12.00, breakDuration: 30, actualStartTime: '2026-06-15T08:00:00Z', actualEndTime: '2026-06-15T14:05:00Z', isPaid: false },
  { _id: 'a3', shiftId: 'sh2', staffId: 's5', hourlyRate: 12.50, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
  { _id: 'a4', shiftId: 'sh2', staffId: 's6', hourlyRate: 13.00, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
  { _id: 'a5', shiftId: 'sh3', staffId: 's7', hourlyRate: 11.50, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
  { _id: 'a6', shiftId: 'sh3', staffId: 's8', hourlyRate: 12.50, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
  { _id: 'a7', shiftId: 'sh4', staffId: 's2', hourlyRate: 13.50, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
  { _id: 'a8', shiftId: 'sh5', staffId: 's3', hourlyRate: 12.00, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
  { _id: 'a9', shiftId: 'sh5', staffId: 's4', hourlyRate: 14.00, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
  { _id: 'a10', shiftId: 'sh6', staffId: 's5', hourlyRate: 12.50, breakDuration: 30, actualStartTime: null, actualEndTime: null, isPaid: false },
]

export const PAYROLL_BATCHES = [
  {
    _id: 'pb1',
    staff: 's2',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    totalHours: 11.0,
    totalPay: 148.50,
    assignments: ['a1', 'a7'],
    status: 'paid',
    processedAt: '2026-05-31',
  },
  {
    _id: 'pb2',
    staff: 's3',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    totalHours: 11.0,
    totalPay: 132.00,
    assignments: ['a2', 'a8'],
    status: 'approved',
    processedAt: '2026-05-28',
  },
  {
    _id: 'pb3',
    staff: 's4',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    totalHours: 7.5,
    totalPay: 105.00,
    assignments: ['a9'],
    status: 'draft',
    processedAt: null,
  },
]

export const getStaff = (id) => STAFF.find(s => s._id === id)
export const getEvent = (id) => EVENTS.find(e => e._id === id)
export const getShift = (id) => SHIFTS.find(s => s._id === id)

export const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase()

export const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const fmtTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export const fmtDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const statusBadge = (status) => {
  const map = {
    confirmed: 'badge-green',
    pending:   'badge-yellow',
    cancelled: 'badge-red',
    draft:     'badge-gray',
    approved:  'badge-blue',
    paid:      'badge-green',
    active:    'badge-green',
  }
  return map[status] || 'badge-gray'
}
