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

// --- payroll-specific mocks ------------------------------------------------
const mockBatchFindOne  = jest.fn();
const mockBatchCreate   = jest.fn();
const mockBatchFind     = jest.fn();
const mockBatchAggregate = jest.fn();

jest.unstable_mockModule('../../models/payrollBatch.js', () => ({
  default: {
    findOne:   mockBatchFindOne,
    create:    mockBatchCreate,
    find:      mockBatchFind,
    aggregate: mockBatchAggregate,
  },
}));

jest.unstable_mockModule('../../models/assignment.js', () => ({
  default: { updateMany: jest.fn().mockResolvedValue({}) },
}));

jest.unstable_mockModule('mongoose', () => ({
  default: {
    Types: { ObjectId: class { constructor(v) { this.v = v; } } },
    startSession: jest.fn().mockResolvedValue({
      startTransaction:  jest.fn(),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction:  jest.fn().mockResolvedValue(undefined),
      endSession:        jest.fn(),
    }),
  },
}));

jest.unstable_mockModule('../../services/payrollService.js', () => ({
  calculatePayrollPreview: jest.fn().mockResolvedValue({
    totalHours: 8,
    totalPay: 120,
    assignments: [{ _id: 'a1' }],
  }),
}));

const { default: payrollRouter } = await import('../../routes/payrollRoutes.js');
const { errorHandler }           = await import('../../middleware/errorMiddleware.js');
const { default: request }       = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/payroll', payrollRouter);
app.use(errorHandler);

const TOKEN = 'Bearer testtoken';

const setUser = (role = 'admin') => {
  mockVerify.mockReturnValue({ id: 'uid1', companyId: 'co1' });
  mockFindUser.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: 'uid1', role, company: 'co1' }),
  });
};

// ---------------------------------------------------------------------------
// GET /api/payroll/my-history  (authenticated, any role)
// ---------------------------------------------------------------------------
describe('GET /api/payroll/my-history', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/payroll/my-history');
    expect(res.status).toBe(401);
  });

  it('returns 200 for authenticated staff', async () => {
    setUser('staff');
    mockBatchFind.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const res = await request(app).get('/api/payroll/my-history').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/payroll/draft  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/payroll/draft', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/payroll/draft').send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app)
      .post('/api/payroll/draft')
      .set('Authorization', TOKEN)
      .send({ staffId: '507f1f77bcf86cd799439013', periodStart: '2025-01-01', periodEnd: '2025-01-31' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when draft already exists', async () => {
    setUser('admin');
    mockUserFindOne.mockResolvedValue({ _id: 'staff1' });
    mockBatchFindOne.mockResolvedValue({ _id: 'b1' });
    const res = await request(app)
      .post('/api/payroll/draft')
      .set('Authorization', TOKEN)
      .send({ staffId: '507f1f77bcf86cd799439013', periodStart: '2025-01-01', periodEnd: '2025-01-31' });
    expect(res.status).toBe(400);
  });

  it('returns the created batch for admin', async () => {
    setUser('admin');
    mockUserFindOne.mockResolvedValue({ _id: 'staff1' });
    mockBatchFindOne.mockResolvedValue(null);
    mockBatchCreate.mockResolvedValue({ _id: 'b1', status: 'draft' });
    const res = await request(app)
      .post('/api/payroll/draft')
      .set('Authorization', TOKEN)
      .send({ staffId: '507f1f77bcf86cd799439013', periodStart: '2025-01-01', periodEnd: '2025-01-31' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'draft');
  });
});

// ---------------------------------------------------------------------------
// POST /api/payroll/:id/approve  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/payroll/:id/approve', () => {
  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).post('/api/payroll/b1/approve').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 404 when batch not found', async () => {
    setUser('admin');
    mockBatchFindOne.mockResolvedValue(null);
    const res = await request(app).post('/api/payroll/b1/approve').set('Authorization', TOKEN);
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful approval', async () => {
    setUser('admin');
    const batch = { status: 'draft', save: jest.fn().mockResolvedValue(undefined) };
    mockBatchFindOne.mockResolvedValue(batch);
    const res = await request(app).post('/api/payroll/b1/approve').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
    expect(batch.status).toBe('approved');
  });
});

// ---------------------------------------------------------------------------
// POST /api/payroll/:id/finalize  (admin only)
// ---------------------------------------------------------------------------
describe('POST /api/payroll/:id/finalize', () => {
  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).post('/api/payroll/b1/finalize').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 400 when batch is not approved', async () => {
    setUser('admin');
    mockBatchFindOne.mockResolvedValue({ status: 'draft', save: jest.fn() });
    const res = await request(app).post('/api/payroll/b1/finalize').set('Authorization', TOKEN);
    expect(res.status).toBe(400);
  });

  it('returns 200 on successful finalization', async () => {
    setUser('admin');
    const batch = { status: 'approved', assignments: [], save: jest.fn().mockResolvedValue(undefined) };
    mockBatchFindOne.mockResolvedValue(batch);
    const res = await request(app).post('/api/payroll/b1/finalize').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/payroll/batches  (admin only)
// ---------------------------------------------------------------------------
describe('GET /api/payroll/batches', () => {
  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).get('/api/payroll/batches').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 200 with batch list for admin', async () => {
    setUser('admin');
    mockBatchFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: 'b1' }]),
      }),
    });
    const res = await request(app).get('/api/payroll/batches').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/payroll/summary  (admin only)
// ---------------------------------------------------------------------------
describe('GET /api/payroll/summary', () => {
  it('returns 403 for non-admin', async () => {
    setUser('staff');
    const res = await request(app).get('/api/payroll/summary?year=2025').set('Authorization', TOKEN);
    expect(res.status).toBe(403);
  });

  it('returns 400 when year is missing', async () => {
    setUser('admin');
    const res = await request(app).get('/api/payroll/summary').set('Authorization', TOKEN);
    expect(res.status).toBe(400);
  });

  it('returns 200 with summary for admin', async () => {
    setUser('admin');
    mockBatchAggregate.mockResolvedValue([{ totalPayroll: 500, totalHours: 40, totalBatches: 2 }]);
    const res = await request(app).get('/api/payroll/summary?year=2025').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalPayroll', 500);
  });

  it('returns zero defaults when no paid batches exist', async () => {
    setUser('admin');
    mockBatchAggregate.mockResolvedValue([]);
    const res = await request(app).get('/api/payroll/summary?year=2025').set('Authorization', TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalPayroll: 0, totalHours: 0, totalBatches: 0 });
  });
});
