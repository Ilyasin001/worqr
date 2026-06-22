import { startDb, clearDb, stopDb, buildApp, seedAdmin, seedStaff, makeAdminToken } from './helper.js';
import request from 'supertest';
import mongoose from 'mongoose';

let app;
let adminToken;
let adminId;
let staffToken;
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
  adminId = admin.user._id.toString();

  const staff = await seedStaff(admin.company);
  staffToken = staff.token;
  staffId = staff.user._id.toString();
});

// ---------------------------------------------------------------------------
// GET /api/users
// ---------------------------------------------------------------------------
describe('GET /api/users', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for staff token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 and array for admin', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/users
// ---------------------------------------------------------------------------
describe('POST /api/users', () => {
  const validBody = {
    name: 'New Employee',
    email: 'newemployee@test.com',
    password: 'Password1',
    hourlyRate: 15,
  };

  it('returns 201 with valid body (admin)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('returns 400 when password is missing', async () => {
    const { password: _pw, ...bodyWithoutPassword } = validBody;
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(bodyWithoutPassword);
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody);
    expect(res.status).toBe(409);
  });

  it('returns 403 for staff token', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/:id
// ---------------------------------------------------------------------------
describe('GET /api/users/:id', () => {
  it('returns 200 for existing user', async () => {
    const res = await request(app)
      .get(`/api/users/${staffId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(staffId);
  });

  it('returns 404 for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id
// ---------------------------------------------------------------------------
describe('PUT /api/users/:id', () => {
  it('returns 200 on name change', async () => {
    const res = await request(app)
      .put(`/api/users/${staffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('returns 403 when admin tries to change their own role', async () => {
    const res = await request(app)
      .put(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'staff' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown user id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/users/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/users/:id', () => {
  it('returns 200 on successful delete', async () => {
    const res = await request(app)
      .delete(`/api/users/${staffId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown user id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
