import { jest } from '@jest/globals';
import express from 'express';

// --- auth mocks ------------------------------------------------------------
const mockVerify = jest.fn();

// User model is used by both protect AND userController — same mock covers both.
const MockUser = {
  findById:          jest.fn(),
  find:              jest.fn(),
  findOne:           jest.fn(),
  findOneAndUpdate:  jest.fn(),
  findOneAndDelete:  jest.fn(),
};
jest.unstable_mockModule('jsonwebtoken', () => ({ default: { verify: mockVerify } }));
jest.unstable_mockModule('../../models/user.js', () => ({ default: MockUser }));
jest.unstable_mockModule('bcrypt', () => ({
  default: { hash: jest.fn().mockResolvedValue('hashed') },
}));

const { default: userRouter } = await import('../../routes/userRoutes.js');
const { errorHandler }        = await import('../../middleware/errorMiddleware.js');
const { default: request }    = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/users', userRouter);
app.use(errorHandler);

const TOKEN = 'Bearer testtoken';

const setUser = (role = 'admin', id = 'uid1') => {
  mockVerify.mockReturnValue({ id, companyId: 'co1' });
  MockUser.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: id, role, company: 'co1' }),
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
    MockUser.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'uid1' }]) });
    const res = await request(app).get('/api/users').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/:id  (self or same-company admin)
// ---------------------------------------------------------------------------
describe('GET /api/users/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/uid1');
    expect(res.status).toBe(401);
  });

  it('forbids a staff member reading another user (403)', async () => {
    setUser('staff', 'uid1');
    const res = await request(app).get('/api/users/uid2').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('lets a staff member read their own profile (200)', async () => {
    setUser('staff', 'uid1');
    MockUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'uid1', name: 'Alice' }) });
    const res = await request(app).get('/api/users/uid1').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });

  it('returns 404 when an admin looks up a missing user', async () => {
    setUser('admin', 'admin1');
    MockUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app).get('/api/users/uid2').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/users/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/users/uid1').send({ name: 'Bob' });
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    setUser('admin', 'admin1');
    MockUser.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app)
      .put('/api/users/uid1')
      .set('Authorization', TOKEN)
      .send({ name: 'Bob' });
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin', 'admin1');
    MockUser.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'uid1', name: 'Bob' }) });
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
    const res = await request(app).delete('/api/users/uid2');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).delete('/api/users/uid2').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 404 when user not found', async () => {
    setUser('admin', 'admin1');
    MockUser.findOneAndDelete.mockResolvedValue(null);
    const res = await request(app).delete('/api/users/uid2').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin', 'admin1');
    MockUser.findOneAndDelete.mockResolvedValue({ _id: 'uid2' });
    const res = await request(app).delete('/api/users/uid2').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});
