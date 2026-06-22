import {
  startDb,
  clearDb,
  stopDb,
  buildApp,
  seedAdmin,
  seedStaff,
  seedEvent,
  seedShift,
  seedStaffUser,
} from './helper.js';
import request from 'supertest';
import mongoose from 'mongoose';
import Assignment from '../../models/assignment.js';

let app;
let adminToken;
let adminId;
let companyId;
let company;
let staffToken;
let staffUserId;
let shiftId;

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
  company = admin.company;
  companyId = company._id.toString();

  const staff = await seedStaff(company);
  staffToken = staff.token;
  staffUserId = staff.user._id.toString();

  const ev = await seedEvent(adminId, companyId);
  const shift = await seedShift(adminId, ev._id.toString(), companyId);
  shiftId = shift._id.toString();
});

// ---------------------------------------------------------------------------
// GET /api/assignments
// ---------------------------------------------------------------------------
describe('GET /api/assignments', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/assignments');
    expect(res.status).toBe(401);
  });

  it('returns 200 for authenticated user', async () => {
    const res = await request(app)
      .get('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/assignments  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/assignments', () => {
  it('returns 201 with valid body including hourlyRate (admin)', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shiftId,
        staffId: staffUserId,
        hourlyRate: 12.5,
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.hourlyRate).toBe(12.5);
  });

  it('returns 400 when hourlyRate is missing', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shiftId,
        staffId: staffUserId,
        // hourlyRate intentionally omitted
      });
    expect(res.status).toBe(400);
  });

  it('returns 403 for staff token', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        shiftId,
        staffId: staffUserId,
        hourlyRate: 12.5,
      });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/assignments/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/assignments/:id', () => {
  let assignmentId;

  beforeEach(async () => {
    const staffUser2 = await seedStaffUser(company);
    const assignment = await Assignment.create({
      shiftId,
      staffId: staffUser2._id,
      company: companyId,
      hourlyRate: 10,
      breakDuration: 0,
    });
    assignmentId = assignment._id.toString();
  });

  it('returns 200 updating breakDuration', async () => {
    const res = await request(app)
      .put(`/api/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ breakDuration: 30 });
    expect(res.status).toBe(200);
    expect(res.body.breakDuration).toBe(30);
  });

  it('returns 404 for unknown assignment id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/assignments/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ breakDuration: 15 });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/assignments/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /api/assignments/:id', () => {
  let assignmentId;

  beforeEach(async () => {
    const staffUser2 = await seedStaffUser(company);
    const assignment = await Assignment.create({
      shiftId,
      staffId: staffUser2._id,
      company: companyId,
      hourlyRate: 10,
      breakDuration: 0,
    });
    assignmentId = assignment._id.toString();
  });

  it('returns 200 on successful delete', async () => {
    const res = await request(app)
      .delete(`/api/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown assignment id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/assignments/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
