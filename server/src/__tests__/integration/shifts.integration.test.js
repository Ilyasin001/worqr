import { startDb, clearDb, stopDb, buildApp, seedAdmin, seedStaff, seedEvent, seedShift } from './helper.js';
import request from 'supertest';
import mongoose from 'mongoose';

let app;
let adminToken;
let adminId;
let companyId;
let staffToken;
let eventId;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

beforeEach(async () => {
  const admin = await seedAdmin();
  adminToken = admin.token;
  adminId = admin.user._id.toString();
  companyId = admin.company._id.toString();

  const staff = await seedStaff(admin.company);
  staffToken = staff.token;

  const ev = await seedEvent(adminId, companyId);
  eventId = ev._id.toString();
});

// ---------------------------------------------------------------------------
// GET /api/shifts
// ---------------------------------------------------------------------------
describe('GET /api/shifts', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/shifts');
    expect(res.status).toBe(401);
  });

  it('returns 200 for authenticated user', async () => {
    const res = await request(app)
      .get('/api/shifts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/shifts  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/shifts', () => {
  it('returns 201 with valid body (admin)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(17, 0, 0, 0);

    const res = await request(app)
      .post('/api/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        managerId: adminId,
        eventId,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });

  it('returns 400 when endTime <= startTime', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    // endTime same as startTime — should fail pre-save hook
    const res = await request(app)
      .post('/api/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        managerId: adminId,
        eventId,
        startTime: tomorrow.toISOString(),
        endTime: tomorrow.toISOString(),
      });
    expect(res.status).toBe(400);
    // The pre-save hook must surface its intended message, not a
    // ReferenceError from a missing `next` (SEC-04 regression guard).
    expect(res.body.message).toBe('End time must be after start time');
  });

  it('returns 403 for staff token', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(17, 0, 0, 0);

    const res = await request(app)
      .post('/api/shifts')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        managerId: adminId,
        eventId,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/shifts/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/shifts/:id', () => {
  it('returns 200 toggling confirmed', async () => {
    const shift = await seedShift(adminId, eventId, companyId);
    const res = await request(app)
      .put(`/api/shifts/${shift._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmed: true });
    expect(res.status).toBe(200);
    expect(res.body.confirmed).toBe(true);
  });

  it('returns 404 for unknown shift id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/shifts/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmed: true });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/shifts/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /api/shifts/:id', () => {
  it('returns 200 on successful delete', async () => {
    const shift = await seedShift(adminId, eventId, companyId);
    const res = await request(app)
      .delete(`/api/shifts/${shift._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown shift id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/shifts/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
