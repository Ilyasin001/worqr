import { jest } from '@jest/globals';
import express from 'express';

// --- auth mocks ------------------------------------------------------------
const mockVerify   = jest.fn();
const mockFindUser = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));

// User model is used by both protect AND userController — same mock covers both.
const MockUser = {
  findById:          jest.fn(),
  find:              jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};
jest.unstable_mockModule('../../models/user.js', () => ({ default: MockUser }));
jest.unstable_mockModule('bcrypt', () => ({
  default: { hash: jest.fn().mockResolvedValue('hashed') },
}));

const { default: userRouter } = await import('../../routes/userRoutes.js');
const { default: request }    = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/users', userRouter);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const TOKEN = 'Bearer testtoken';

const setUser = (role = 'admin') => {
  mockVerify.mockReturnValue({ id: 'uid1' });
  MockUser.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: 'uid1', role }),
  });
};

// ---------------------------------------------------------------------------
// GET /api/users  (admin only)
// ---------------------------------------------------------------------------
describe('GET /api/users', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).get('/api/users').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 200 with user list for admin', async () => {
    setUser('admin');
    MockUser.find.mockResolvedValue([{ _id: 'uid1' }]);
    const res = await request(app).get('/api/users').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/:id  (any authenticated user)
// ---------------------------------------------------------------------------
describe('GET /api/users/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/uid1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    setUser('staff');
    // Simulate findById returning null for the route param (not the protect call)
    // protect calls findById first (returns staff user), then the controller calls it again
    MockUser.findById
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ _id: 'uid1', role: 'staff' }) })
      .mockResolvedValueOnce(null);
    const res = await request(app).get('/api/users/uid2').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 for authenticated user', async () => {
    setUser('staff');
    MockUser.findById
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue({ _id: 'uid1', role: 'staff' }) })
      .mockResolvedValueOnce({ _id: 'uid1', name: 'Alice' });
    const res = await request(app).get('/api/users/uid1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id  (any authenticated user)
// ---------------------------------------------------------------------------
describe('PUT /api/users/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/users/uid1').send({ name: 'Bob' });
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    setUser('staff');
    MockUser.findByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/users/uid1')
      .set('Authorization', TOKEN)
      .send({ name: 'Bob' });
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('staff');
    MockUser.findByIdAndUpdate.mockResolvedValue({ _id: 'uid1', name: 'Bob' });
    const res = await request(app)
      .put('/api/users/uid1')
      .set('Authorization', TOKEN)
      .send({ name: 'Bob' });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/users/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /api/users/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/users/uid1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).delete('/api/users/uid1').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 404 when user not found', async () => {
    setUser('admin');
    MockUser.findByIdAndDelete.mockResolvedValue(null);
    const res = await request(app).delete('/api/users/uid1').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockUser.findByIdAndDelete.mockResolvedValue({ _id: 'uid1' });
    const res = await request(app).delete('/api/users/uid1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});
