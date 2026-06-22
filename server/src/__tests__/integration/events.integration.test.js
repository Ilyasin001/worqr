import { startDb, clearDb, stopDb, buildApp, seedAdmin, seedStaff, seedEvent } from './helper.js';
import request from 'supertest';
import mongoose from 'mongoose';

let app;
let adminToken;
let adminId;
let companyId;
let staffToken;

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

  // Staff in the same company.
  const staff = await seedStaff(admin.company);
  staffToken = staff.token;
});

// ---------------------------------------------------------------------------
// GET /api/events  (now protected + company-scoped)
// ---------------------------------------------------------------------------
describe('GET /api/events', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(401);
  });

  it('returns 200 (company-scoped) for staff token', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns the company\'s events for admin token', async () => {
    await seedEvent(adminId, companyId);
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/events  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/events', () => {
  const validBody = {
    title: 'Summer Gala',
    date: '2026-08-15T18:00:00.000Z',
  };

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/events').send(validBody);
    expect(res.status).toBe(401);
  });

  it('returns 201 with valid body (admin), company set from token', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Summer Gala');
    expect(res.body.company).toBe(companyId);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ date: '2026-08-15T18:00:00.000Z' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for staff token', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/events/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/events/:id', () => {
  it('returns 200 updating event status', async () => {
    const ev = await seedEvent(adminId, companyId);
    const res = await request(app)
      .put(`/api/events/${ev._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('returns 404 for unknown event id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/events/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/events/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /api/events/:id', () => {
  it('returns 200 on successful delete', async () => {
    const ev = await seedEvent(adminId, companyId);
    const res = await request(app)
      .delete(`/api/events/${ev._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown event id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/events/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
