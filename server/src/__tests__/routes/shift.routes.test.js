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

// --- shift model mocks -----------------------------------------------------
const mockSave  = jest.fn();
const MockShift = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockShift.find              = jest.fn();
MockShift.findById          = jest.fn();
MockShift.findByIdAndUpdate = jest.fn();
MockShift.findByIdAndDelete = jest.fn();

jest.unstable_mockModule('../../models/shift.js', () => ({ default: MockShift }));

const { default: shiftRouter } = await import('../../routes/shiftRoutes.js');
const { default: request }     = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/shifts', shiftRouter);

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
// GET /api/shifts  (authenticated, any role)
// ---------------------------------------------------------------------------
describe('GET /api/shifts', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/shifts');
    expect(res.status).toBe(401);
  });

  it('returns 200 with shift list for authenticated user', async () => {
    setUser('staff');
    MockShift.find.mockResolvedValue([{ _id: 's1' }]);
    const res = await request(app).get('/api/shifts').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/shifts/:id  (authenticated)
// ---------------------------------------------------------------------------
describe('GET /api/shifts/:id', () => {
  it('returns 404 when shift not found', async () => {
    setUser('staff');
    MockShift.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/shifts/s1').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 for existing shift', async () => {
    setUser('staff');
    MockShift.findById.mockResolvedValue({ _id: 's1' });
    const res = await request(app).get('/api/shifts/s1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/shifts  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/shifts', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/shifts').send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app)
      .post('/api/shifts')
      .set('Authorization', TOKEN)
      .send({ managerId: 'uid1', startTime: '2025-01-01T09:00:00Z', endTime: '2025-01-01T17:00:00Z', eventId: 'ev1' });
    expect(res.status).toBe(403);
  });

  it('returns 201 for admin with valid body', async () => {
    setUser('admin');
    const saved = { _id: 's1' };
    mockSave.mockResolvedValue(saved);
    const res = await request(app)
      .post('/api/shifts')
      .set('Authorization', TOKEN)
      .send({ managerId: '507f1f77bcf86cd799439011', startTime: '2025-01-01T09:00:00Z', endTime: '2025-01-01T17:00:00Z', eventId: '507f1f77bcf86cd799439012' });
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/shifts/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/shifts/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/shifts/s1').send({ confirmed: true });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app)
      .put('/api/shifts/s1')
      .set('Authorization', TOKEN)
      .send({ confirmed: true });
    expect(res.status).toBe(403);
  });

  it('returns 404 when shift not found', async () => {
    setUser('admin');
    MockShift.findByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/shifts/s1')
      .set('Authorization', TOKEN)
      .send({ confirmed: true });
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockShift.findByIdAndUpdate.mockResolvedValue({ _id: 's1', confirmed: true });
    const res = await request(app)
      .put('/api/shifts/s1')
      .set('Authorization', TOKEN)
      .send({ confirmed: true });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/shifts/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /api/shifts/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/shifts/s1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).delete('/api/shifts/s1').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 404 when shift not found', async () => {
    setUser('admin');
    MockShift.findByIdAndDelete.mockResolvedValue(null);
    const res = await request(app).delete('/api/shifts/s1').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockShift.findByIdAndDelete.mockResolvedValue({ _id: 's1' });
    const res = await request(app).delete('/api/shifts/s1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});
