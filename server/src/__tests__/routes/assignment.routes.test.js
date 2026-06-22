import { jest } from '@jest/globals';
import express from 'express';

// --- auth mocks ------------------------------------------------------------
const mockVerify   = jest.fn();
const mockFindUser = jest.fn();
const mockUserFindOne = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));
jest.unstable_mockModule('../../models/user.js', () => ({
  default: { findById: mockFindUser, findOne: mockUserFindOne },
}));

// --- shift mock (cross-entity check) ---------------------------------------
const mockShiftFindOne = jest.fn();
jest.unstable_mockModule('../../models/shift.js', () => ({ default: { findOne: mockShiftFindOne } }));

// --- assignment model mocks ------------------------------------------------
const MockAssignment = jest.fn();
MockAssignment.create           = jest.fn();
MockAssignment.find             = jest.fn();
MockAssignment.findOne          = jest.fn();
MockAssignment.findOneAndUpdate = jest.fn();
MockAssignment.findOneAndDelete = jest.fn();

jest.unstable_mockModule('../../models/assignment.js', () => ({ default: MockAssignment }));

const { default: assignmentRouter } = await import('../../routes/assignmentRoutes.js');
const { errorHandler }              = await import('../../middleware/errorMiddleware.js');
const { default: request }          = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/assignments', assignmentRouter);
app.use(errorHandler);

const TOKEN = 'Bearer testtoken';

const setUser = (role = 'admin') => {
  mockVerify.mockReturnValue({ id: 'uid1', companyId: 'co1' });
  mockFindUser.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: 'uid1', role, company: 'co1' }),
  });
};

// ---------------------------------------------------------------------------
// GET /api/assignments  (authenticated)
// ---------------------------------------------------------------------------
describe('GET /api/assignments', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/assignments');
    expect(res.status).toBe(401);
  });

  it('returns 200 with assignment list for authenticated user', async () => {
    setUser('staff');
    MockAssignment.find.mockResolvedValue([{ _id: 'a1' }]);
    const res = await request(app).get('/api/assignments').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/assignments/:id  (authenticated)
// ---------------------------------------------------------------------------
describe('GET /api/assignments/:id', () => {
  it('returns 404 when not found', async () => {
    setUser('staff');
    MockAssignment.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 for existing assignment', async () => {
    setUser('staff');
    MockAssignment.findOne.mockResolvedValue({ _id: 'a1' });
    const res = await request(app).get('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/assignments  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/assignments', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/assignments').send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', TOKEN)
      .send({ shiftId: '507f1f77bcf86cd799439011', staffId: '507f1f77bcf86cd799439012', hourlyRate: 12.5, breakDuration: 30 });
    expect(res.status).toBe(403);
  });

  it('returns 201 for admin with in-company refs and valid body', async () => {
    setUser('admin');
    mockShiftFindOne.mockResolvedValue({ _id: 's1', startTime: new Date('2026-01-01T09:00:00Z'), endTime: new Date('2026-01-01T17:00:00Z') });
    mockUserFindOne.mockResolvedValue({ _id: 'uid2' });
    MockAssignment.find.mockReturnValue({ populate: () => Promise.resolve([]) }); // no conflicts
    MockAssignment.create.mockResolvedValue({ _id: 'a1' });
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', TOKEN)
      .send({ shiftId: '507f1f77bcf86cd799439011', staffId: '507f1f77bcf86cd799439012', hourlyRate: 12.5, breakDuration: 30 });
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/assignments/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/assignments/:id', () => {
  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app)
      .put('/api/assignments/a1')
      .set('Authorization', TOKEN)
      .send({ isPaid: true });
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setUser('admin');
    MockAssignment.findOneAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/assignments/a1')
      .set('Authorization', TOKEN)
      .send({ isPaid: true });
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockAssignment.findOneAndUpdate.mockResolvedValue({ _id: 'a1', isPaid: true });
    const res = await request(app)
      .put('/api/assignments/a1')
      .set('Authorization', TOKEN)
      .send({ isPaid: true });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/assignments/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /api/assignments/:id', () => {
  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).delete('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setUser('admin');
    MockAssignment.findOneAndDelete.mockResolvedValue(null);
    const res = await request(app).delete('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockAssignment.findOneAndDelete.mockResolvedValue({ _id: 'a1' });
    const res = await request(app).delete('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});
