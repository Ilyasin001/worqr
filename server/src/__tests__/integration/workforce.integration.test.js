// Phase 3 — workforce operations: event filtering/search/capacity, shift
// filtering, assignment conflict detection and status transitions.
import { startDb, clearDb, stopDb, buildApp, seedAdmin, seedStaff, seedStaffUser, seedEvent } from './helper.js';
import request from 'supertest';

let app;
let admin, staff, event;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

beforeEach(async () => {
  admin = await seedAdmin();
  staff = await seedStaff(admin.company);
  event = await seedEvent(admin.user._id.toString(), admin.company._id.toString());
});

const asAdmin = () => ({ Authorization: `Bearer ${admin.token}` });
const asStaff = () => ({ Authorization: `Bearer ${staff.token}` });

const createShift = (start, end) =>
  request(app).post('/api/shifts').set(asAdmin()).send({
    managerId: admin.user._id.toString(),
    eventId: event._id.toString(),
    startTime: start,
    endTime: end,
  });

const assign = (shiftId, token = admin.token) =>
  request(app).post('/api/assignments').set('Authorization', `Bearer ${token}`).send({
    shiftId,
    staffId: staff.user._id.toString(),
    hourlyRate: 12,
  });

// ---------------------------------------------------------------------------
// Events: capacity, notes, filtering, search
// ---------------------------------------------------------------------------
describe('events — capacity & notes', () => {
  it('persists capacity and notes on create', async () => {
    const res = await request(app).post('/api/events').set(asAdmin()).send({
      title: 'Capacity Gala', date: '2026-09-01T18:00:00.000Z', capacity: 20, notes: 'Black tie',
    });
    expect(res.status).toBe(201);
    expect(res.body.capacity).toBe(20);
    expect(res.body.notes).toBe('Black tie');
  });

  it('rejects a negative capacity', async () => {
    const res = await request(app).post('/api/events').set(asAdmin()).send({
      title: 'Bad', date: '2026-09-01T18:00:00.000Z', capacity: -3,
    });
    expect(res.status).toBe(400);
  });

  it('reports a live filledCount from active assignments', async () => {
    const shift = await createShift('2026-03-01T09:00:00.000Z', '2026-03-01T17:00:00.000Z');
    await assign(shift.body._id);
    const res = await request(app).get('/api/events').set(asAdmin());
    const ev = res.body.find(e => e._id === event._id.toString());
    expect(ev.filledCount).toBe(1);
  });
});

describe('events — filtering & search', () => {
  beforeEach(async () => {
    await request(app).post('/api/events').set(asAdmin()).send({ title: 'Summer Festival', description: 'outdoor music', date: '2026-06-01T00:00:00.000Z', status: 'confirmed' });
    await request(app).post('/api/events').set(asAdmin()).send({ title: 'Winter Gala', description: 'indoor dinner', date: '2026-12-01T00:00:00.000Z', status: 'pending' });
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/events?status=confirmed').set(asAdmin());
    expect(res.status).toBe(200);
    expect(res.body.every(e => e.status === 'confirmed')).toBe(true);
    expect(res.body.some(e => e.title === 'Summer Festival')).toBe(true);
  });

  it('searches title/description (case-insensitive)', async () => {
    const res = await request(app).get('/api/events?q=music').set(asAdmin());
    expect(res.body.map(e => e.title)).toContain('Summer Festival');
    expect(res.body.map(e => e.title)).not.toContain('Winter Gala');
  });

  it('filters by date range', async () => {
    const res = await request(app).get('/api/events?from=2026-11-01&to=2026-12-31').set(asAdmin());
    expect(res.body.map(e => e.title)).toContain('Winter Gala');
    expect(res.body.map(e => e.title)).not.toContain('Summer Festival');
  });
});

// ---------------------------------------------------------------------------
// Shifts: filtering
// ---------------------------------------------------------------------------
describe('shifts — filtering', () => {
  it('filters by confirmed flag and date range', async () => {
    await createShift('2026-03-01T09:00:00.000Z', '2026-03-01T17:00:00.000Z');
    await createShift('2026-03-10T09:00:00.000Z', '2026-03-10T17:00:00.000Z');

    const ranged = await request(app).get('/api/shifts?from=2026-03-05&to=2026-03-15').set(asAdmin());
    expect(ranged.status).toBe(200);
    expect(ranged.body).toHaveLength(1);

    const byEvent = await request(app).get(`/api/shifts?eventId=${event._id}`).set(asAdmin());
    expect(byEvent.body.length).toBe(2);

    const confirmed = await request(app).get('/api/shifts?confirmed=true').set(asAdmin());
    expect(confirmed.body).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Assignments: conflict detection + status
// ---------------------------------------------------------------------------
describe('assignments — conflict detection', () => {
  it('blocks double-booking a staff member on overlapping shifts (409)', async () => {
    const s1 = await createShift('2026-03-01T09:00:00.000Z', '2026-03-01T17:00:00.000Z');
    const s2 = await createShift('2026-03-01T12:00:00.000Z', '2026-03-01T20:00:00.000Z'); // overlaps s1

    const first = await assign(s1.body._id);
    expect(first.status).toBe(201);

    const second = await assign(s2.body._id);
    expect(second.status).toBe(409);
  });

  it('allows assignments on non-overlapping shifts', async () => {
    const s1 = await createShift('2026-03-01T09:00:00.000Z', '2026-03-01T17:00:00.000Z');
    const s2 = await createShift('2026-03-02T09:00:00.000Z', '2026-03-02T17:00:00.000Z'); // next day

    expect((await assign(s1.body._id)).status).toBe(201);
    expect((await assign(s2.body._id)).status).toBe(201);
  });
});

describe('assignments — status transitions', () => {
  let assignmentId;
  beforeEach(async () => {
    const shift = await createShift('2026-03-01T09:00:00.000Z', '2026-03-01T17:00:00.000Z');
    const a = await assign(shift.body._id);
    assignmentId = a.body._id;
  });

  it('lets the assigned staff member confirm their own assignment', async () => {
    const res = await request(app).patch(`/api/assignments/${assignmentId}/status`).set(asStaff()).send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('forbids staff from cancelling (admin-only status)', async () => {
    const res = await request(app).patch(`/api/assignments/${assignmentId}/status`).set(asStaff()).send({ status: 'cancelled' });
    expect(res.status).toBe(403);
  });

  it('lets an admin cancel an assignment', async () => {
    const res = await request(app).patch(`/api/assignments/${assignmentId}/status`).set(asAdmin()).send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('rejects an invalid status value', async () => {
    const res = await request(app).patch(`/api/assignments/${assignmentId}/status`).set(asAdmin()).send({ status: 'banana' });
    expect(res.status).toBe(400);
  });

  it('frees up the slot when an assignment is cancelled (filledCount drops)', async () => {
    await request(app).patch(`/api/assignments/${assignmentId}/status`).set(asAdmin()).send({ status: 'cancelled' });
    const res = await request(app).get(`/api/events/${event._id}`).set(asAdmin());
    expect(res.body.filledCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Recurring shifts
// ---------------------------------------------------------------------------
describe('shifts — recurring', () => {
  it('generates a weekly series of the requested length', async () => {
    const res = await request(app).post('/api/shifts').set(asAdmin()).send({
      managerId: admin.user._id.toString(),
      eventId: event._id.toString(),
      startTime: '2026-04-01T09:00:00.000Z',
      endTime: '2026-04-01T17:00:00.000Z',
      repeat: { frequency: 'weekly', count: 3 },
    });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    // A week apart.
    const starts = res.body.map(s => new Date(s.startTime).getTime()).sort((a, b) => a - b);
    expect(starts[1] - starts[0]).toBe(7 * 24 * 3600 * 1000);
  });

  it('rejects an out-of-range recurrence count', async () => {
    const res = await request(app).post('/api/shifts').set(asAdmin()).send({
      managerId: admin.user._id.toString(),
      eventId: event._id.toString(),
      startTime: '2026-04-01T09:00:00.000Z',
      endTime: '2026-04-01T17:00:00.000Z',
      repeat: { frequency: 'weekly', count: 999 },
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Open shifts + claim (staff self-service)
// ---------------------------------------------------------------------------
describe('shifts — open & claim', () => {
  const createShift = (start, end) =>
    request(app).post('/api/shifts').set(asAdmin()).send({
      managerId: admin.user._id.toString(), eventId: event._id.toString(), startTime: start, endTime: end,
    });

  it('lists upcoming claimable shifts and removes them once claimed', async () => {
    const shift = await createShift('2099-04-01T09:00:00.000Z', '2099-04-01T17:00:00.000Z');

    const openBefore = await request(app).get('/api/shifts/open').set(asStaff());
    expect(openBefore.status).toBe(200);
    expect(openBefore.body.some(s => s._id === shift.body._id)).toBe(true);

    const claim = await request(app).post(`/api/shifts/${shift.body._id}/claim`).set(asStaff());
    expect(claim.status).toBe(201);
    expect(claim.body.staffId).toBe(staff.user._id.toString());

    const openAfter = await request(app).get('/api/shifts/open').set(asStaff());
    expect(openAfter.body.some(s => s._id === shift.body._id)).toBe(false);

    // The claim fills a slot on the event.
    const ev = await request(app).get(`/api/events/${event._id}`).set(asStaff());
    expect(ev.body.filledCount).toBe(1);
  });

  it('rejects claiming the same shift twice (409)', async () => {
    const shift = await createShift('2099-05-01T09:00:00.000Z', '2099-05-01T17:00:00.000Z');
    expect((await request(app).post(`/api/shifts/${shift.body._id}/claim`).set(asStaff())).status).toBe(201);
    expect((await request(app).post(`/api/shifts/${shift.body._id}/claim`).set(asStaff())).status).toBe(409);
  });

  it('rejects claiming a shift that overlaps one already held (409)', async () => {
    const s1 = await createShift('2099-06-01T09:00:00.000Z', '2099-06-01T17:00:00.000Z');
    const s2 = await createShift('2099-06-01T12:00:00.000Z', '2099-06-01T20:00:00.000Z');
    expect((await request(app).post(`/api/shifts/${s1.body._id}/claim`).set(asStaff())).status).toBe(201);
    expect((await request(app).post(`/api/shifts/${s2.body._id}/claim`).set(asStaff())).status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// Admin reassignment with conflict detection
// ---------------------------------------------------------------------------
describe('assignments — reassignment', () => {
  it('blocks reassigning to a staff member who is already booked on an overlapping shift', async () => {
    const other = await seedStaffUser(admin.company);
    const createShift = (start, end) =>
      request(app).post('/api/shifts').set(asAdmin()).send({
        managerId: admin.user._id.toString(), eventId: event._id.toString(), startTime: start, endTime: end,
      });

    const s1 = await createShift('2026-07-01T09:00:00.000Z', '2026-07-01T17:00:00.000Z');
    const s2 = await createShift('2026-07-01T12:00:00.000Z', '2026-07-01T20:00:00.000Z');

    // `other` works s1; `staff` works s2.
    await request(app).post('/api/assignments').set(asAdmin()).send({ shiftId: s1.body._id, staffId: other._id.toString(), hourlyRate: 10 });
    const a2 = await request(app).post('/api/assignments').set(asAdmin()).send({ shiftId: s2.body._id, staffId: staff.user._id.toString(), hourlyRate: 10 });

    // Reassigning s2 to `other` would double-book them against s1.
    const res = await request(app).put(`/api/assignments/${a2.body._id}`).set(asAdmin()).send({ staffId: other._id.toString() });
    expect(res.status).toBe(409);
  });
});
