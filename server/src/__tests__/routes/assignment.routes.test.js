import { jest } from '@jest/globals';
import express from 'express';

// --- auth mocks ------------------------------------------------------------
const mockVerify   = jest.fn();
const mockFindUser = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));
jest.unstable_mockModule('../../models/user.js', () => ({
  default: { findById: mockFindUser },
}));

// --- assignment model mocks ------------------------------------------------
const mockSave       = jest.fn();
const MockAssignment = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockAssignment.find              = jest.fn();
MockAssignment.findById          = jest.fn();
MockAssignment.findByIdAndUpdate = jest.fn();
MockAssignment.findByIdAndDelete = jest.fn();

jest.unstable_mockModule('../../models/assignment.js', () => ({ default: MockAssignment }));

const { default: assignmentRouter } = await import('../../routes/assignmentRoutes.js');
const { default: request }          = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/assignments', assignmentRouter);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const TOKEN = 'Bearer testtoken';

const setUser = (role = 'admin') => {
  mockVerify.mockReturnValue({ id: 'uid1' });
  mockFindUser.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: 'uid1', role }),
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
    MockAssignment.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 for existing assignment', async () => {
    setUser('staff');
    MockAssignment.findById.mockResolvedValue({ _id: 'a1' });
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
      .send({ shiftId: 's1', staffId: 'uid1', breakDuration: 30 });
    expect(res.status).toBe(403);
  });

  it('returns 201 for admin with valid body', async () => {
    setUser('admin');
    const saved = { _id: 'a1', shiftId: '507f1f77bcf86cd799439011' };
    mockSave.mockResolvedValue(saved);
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', TOKEN)
      .send({ shiftId: '507f1f77bcf86cd799439011', staffId: '507f1f77bcf86cd799439012', breakDuration: 30 });
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/assignments/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/assignments/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/assignments/a1').send({});
    expect(res.status).toBe(401);
  });

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
    MockAssignment.findByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/assignments/a1')
      .set('Authorization', TOKEN)
      .send({ isPaid: true });
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockAssignment.findByIdAndUpdate.mockResolvedValue({ _id: 'a1', isPaid: true });
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
  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/assignments/a1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).delete('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setUser('admin');
    MockAssignment.findByIdAndDelete.mockResolvedValue(null);
    const res = await request(app).delete('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockAssignment.findByIdAndDelete.mockResolvedValue({ _id: 'a1' });
    const res = await request(app).delete('/api/assignments/a1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});
