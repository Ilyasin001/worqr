// End-to-end payroll workflow against a real (in-memory replica set) DB,
// exercising the finalize transaction that marks assignments paid.
import { startDb, clearDb, stopDb, buildApp, seedAdmin, seedStaff, seedEvent } from './helper.js';
import request from 'supertest';
import Shift from '../../models/shift.js';
import Assignment from '../../models/assignment.js';

let app;
let adminToken;
let companyId;
let staffId;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

beforeEach(async () => {
  const admin = await seedAdmin();
  adminToken = admin.token;
  companyId = admin.company._id.toString();

  const staff = await seedStaff(admin.company);
  staffId = staff.user._id.toString();

  const ev = await seedEvent(admin.user._id.toString(), companyId);

  // A worked shift inside January 2026 with recorded actual times.
  const shift = await Shift.create({
    managerId: admin.user._id,
    eventId: ev._id,
    company: companyId,
    startTime: new Date('2026-01-10T09:00:00.000Z'),
    endTime: new Date('2026-01-10T17:00:00.000Z'),
  });
  await Assignment.create({
    shiftId: shift._id,
    staffId,
    company: companyId,
    hourlyRate: 10,
    breakDuration: 0,
    actualStartTime: new Date('2026-01-10T09:00:00.000Z'),
    actualEndTime: new Date('2026-01-10T17:00:00.000Z'),
  });
});

describe('payroll draft → approve → finalize', () => {
  const period = { periodStart: '2026-01-01', periodEnd: '2026-01-31' };

  const draft = () =>
    request(app).post('/api/payroll/draft').set('Authorization', `Bearer ${adminToken}`).send({ staffId, ...period });

  it('computes 8 hours / £80 in the draft', async () => {
    const res = await draft();
    expect(res.status).toBe(200);
    expect(res.body.totalHours).toBeCloseTo(8);
    expect(res.body.totalPay).toBeCloseTo(80);
    expect(res.body.status).toBe('draft');
  });

  it('blocks a second overlapping draft for the same staff/period', async () => {
    await draft();
    const res = await draft();
    expect(res.status).toBe(400);
  });

  it('runs the full lifecycle and marks the assignment paid', async () => {
    const created = await draft();
    const id = created.body._id;

    const approved = await request(app)
      .post(`/api/payroll/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approved.status).toBe(200);

    const finalized = await request(app)
      .post(`/api/payroll/${id}/finalize`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(finalized.status).toBe(200);
    expect(finalized.body.batch.status).toBe('paid');

    // The transaction must have flipped the assignment to paid.
    const paid = await Assignment.findOne({ staffId });
    expect(paid.isPaid).toBe(true);
    expect(paid.paidAt).toBeTruthy();
  });

  it('cannot finalize before approval', async () => {
    const created = await draft();
    const res = await request(app)
      .post(`/api/payroll/${created.body._id}/finalize`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});
