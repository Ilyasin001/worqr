import { jest } from '@jest/globals';
import express from 'express';

// --- auth mocks (protect middleware) ---------------------------------------
const mockVerify   = jest.fn();
const mockFindUser = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));
jest.unstable_mockModule('../../models/user.js', () => ({
  default: { findById: mockFindUser },
}));

// --- event model mocks -----------------------------------------------------
const mockSave = jest.fn();
const MockEvent = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockEvent.find              = jest.fn();
MockEvent.findById          = jest.fn();
MockEvent.findByIdAndUpdate = jest.fn();
MockEvent.findByIdAndDelete = jest.fn();

jest.unstable_mockModule('../../models/event.js', () => ({ default: MockEvent }));

const { default: eventRouter } = await import('../../routes/eventRoutes.js');
const { default: request }     = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/events', eventRouter);

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
// GET /api/events  (public — no protect on this route)
// ---------------------------------------------------------------------------
describe('GET /api/events', () => {
  it('returns all events with 200', async () => {
    MockEvent.find.mockResolvedValue([{ _id: 'e1', title: 'Gala' }]);
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/events/:id  (public)
// ---------------------------------------------------------------------------
describe('GET /api/events/:id', () => {
  it('returns the event with 200', async () => {
    MockEvent.findById.mockResolvedValue({ _id: 'e1', title: 'Gala' });
    const res = await request(app).get('/api/events/e1');
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/events  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/events', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ title: 'Gala', date: '2025-06-01' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    setUser('staff');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', TOKEN)
      .send({ title: 'Gala', date: '2025-06-01', createdBy: 'uid1' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when validation fails (missing title)', async () => {
    setUser('admin');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', TOKEN)
      .send({ date: '2025-06-01' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when date is invalid', async () => {
    setUser('admin');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', TOKEN)
      .send({ title: 'Gala', date: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('returns 201 for admin with valid body', async () => {
    setUser('admin');
    const saved = { _id: 'e1', title: 'Gala' };
    mockSave.mockResolvedValue(saved);
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', TOKEN)
      .send({ title: 'Gala', date: '2025-06-01T00:00:00.000Z', createdBy: 'uid1' });
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/events/:id  (admin only)
// ---------------------------------------------------------------------------
describe('PUT /api/events/:id', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).put('/api/events/e1').send({ title: 'New' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    setUser('staff');
    const res = await request(app)
      .put('/api/events/e1')
      .set('Authorization', TOKEN)
      .send({ title: 'New' });
    expect(res.status).toBe(403);
  });

  it('returns 404 when event not found', async () => {
    setUser('admin');
    MockEvent.findByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/events/e1')
      .set('Authorization', TOKEN)
      .send({ title: 'New' });
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockEvent.findByIdAndUpdate.mockResolvedValue({ _id: 'e1', title: 'New' });
    const res = await request(app)
      .put('/api/events/e1')
      .set('Authorization', TOKEN)
      .send({ title: 'New' });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/events/:id  (admin only)
// ---------------------------------------------------------------------------
describe('DELETE /api/events/:id', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).delete('/api/events/e1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when event not found', async () => {
    setUser('admin');
    MockEvent.findByIdAndDelete.mockResolvedValue(null);
    const res = await request(app)
      .delete('/api/events/e1')
      .set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    setUser('admin');
    MockEvent.findByIdAndDelete.mockResolvedValue({ _id: 'e1' });
    const res = await request(app)
      .delete('/api/events/e1')
      .set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});
