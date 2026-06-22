import { jest } from '@jest/globals';

// --- mock setup (must precede dynamic import of the module under test) ------

const mockBatchFindOne  = jest.fn();
const mockBatchCreate   = jest.fn();
const mockAssignmentUpdateMany = jest.fn();
const mockUserFindOne   = jest.fn();
const mockStartSession  = jest.fn();
const mockCalculatePayrollPreview = jest.fn();

jest.unstable_mockModule('../../models/payrollBatch.js', () => ({
  default: {
    findOne: mockBatchFindOne,
    create:  mockBatchCreate,
  },
}));

jest.unstable_mockModule('../../models/assignment.js', () => ({
  default: { updateMany: mockAssignmentUpdateMany },
}));

jest.unstable_mockModule('../../models/user.js', () => ({
  default: { findOne: mockUserFindOne },
}));

jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: mockStartSession, Types: { ObjectId: class { constructor(v) { this.v = v; } } } },
}));

jest.unstable_mockModule('../../services/payrollService.js', () => ({
  calculatePayrollPreview: mockCalculatePayrollPreview,
}));

const { approvePayroll, finalizePayroll, createPayrollDraft } = await import('../../controllers/payrollController.js');

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const makeSession = () => ({
  startTransaction:  jest.fn(),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  abortTransaction:  jest.fn().mockResolvedValue(undefined),
  endSession:        jest.fn(),
});
const ctx = { companyId: 'co1', user: { _id: 'admin1' } };

// ---------------------------------------------------------------------------
// approvePayroll
// ---------------------------------------------------------------------------
describe('approvePayroll', () => {
  it('returns 404 when batch does not exist in company', async () => {
    mockBatchFindOne.mockResolvedValue(null);
    const res = makeRes();

    await approvePayroll({ ...ctx, params: { id: 'b1' } }, res, jest.fn());

    expect(mockBatchFindOne).toHaveBeenCalledWith({ _id: 'b1', company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when batch is not in draft status', async () => {
    mockBatchFindOne.mockResolvedValue({ status: 'approved', save: jest.fn() });
    const res = makeRes();

    await approvePayroll({ ...ctx, params: { id: 'b1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sets status to approved and saves on success', async () => {
    const batch = { status: 'draft', save: jest.fn().mockResolvedValue(undefined) };
    mockBatchFindOne.mockResolvedValue(batch);
    const res = makeRes();

    await approvePayroll({ ...ctx, params: { id: 'b1' } }, res, jest.fn());

    expect(batch.status).toBe('approved');
    expect(batch.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payroll approved' }));
  });
});

// ---------------------------------------------------------------------------
// finalizePayroll
// ---------------------------------------------------------------------------
describe('finalizePayroll', () => {
  it('returns 404 when batch does not exist in company', async () => {
    mockBatchFindOne.mockResolvedValue(null);
    const res = makeRes();

    await finalizePayroll({ ...ctx, params: { id: 'b1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when batch is not approved', async () => {
    mockBatchFindOne.mockResolvedValue({ status: 'draft', save: jest.fn() });
    const res = makeRes();

    await finalizePayroll({ ...ctx, params: { id: 'b1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('marks assignments paid and sets batch status to paid on success', async () => {
    const batch = {
      status: 'approved',
      assignments: ['a1', 'a2'],
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockBatchFindOne.mockResolvedValue(batch);
    mockAssignmentUpdateMany.mockResolvedValue({});
    const session = makeSession();
    mockStartSession.mockResolvedValue(session);
    const res = makeRes();

    await finalizePayroll({ ...ctx, params: { id: 'b1' } }, res, jest.fn());

    expect(mockAssignmentUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: batch.assignments } },
      expect.objectContaining({ $set: expect.objectContaining({ isPaid: true }) }),
      expect.objectContaining({ session }),
    );
    expect(batch.status).toBe('paid');
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payroll completed' }));
  });

  it('aborts the transaction and forwards the error via next on DB error', async () => {
    const batch = { status: 'approved', assignments: [], save: jest.fn() };
    mockBatchFindOne.mockResolvedValue(batch);
    mockAssignmentUpdateMany.mockRejectedValue(new Error('DB error'));
    const session = makeSession();
    mockStartSession.mockResolvedValue(session);
    const next = jest.fn();

    await finalizePayroll({ ...ctx, params: { id: 'b1' } }, makeRes(), next);

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ---------------------------------------------------------------------------
// createPayrollDraft
// ---------------------------------------------------------------------------
describe('createPayrollDraft', () => {
  const req = {
    ...ctx,
    body: { staffId: 'staff1', periodStart: '2025-01-01', periodEnd: '2025-01-31' },
  };

  it('calls next with 400 when the staff member is not in the company', async () => {
    mockUserFindOne.mockResolvedValue(null);
    const next = jest.fn();

    await createPayrollDraft(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(mockBatchCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when a draft or approved batch already exists for the period', async () => {
    mockUserFindOne.mockResolvedValue({ _id: 'staff1' });
    mockCalculatePayrollPreview.mockResolvedValue({ totalHours: 8, totalPay: 120, assignments: [] });
    mockBatchFindOne.mockResolvedValue({ _id: 'existing' });
    const res = makeRes();

    await createPayrollDraft(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockBatchCreate).not.toHaveBeenCalled();
  });

  it('creates a company-scoped draft batch when none exists', async () => {
    mockUserFindOne.mockResolvedValue({ _id: 'staff1' });
    mockCalculatePayrollPreview.mockResolvedValue({ totalHours: 8, totalPay: 120, assignments: [{ _id: 'a1' }] });
    mockBatchFindOne.mockResolvedValue(null);
    const createdBatch = { _id: 'b1', status: 'draft' };
    mockBatchCreate.mockResolvedValue(createdBatch);
    const res = makeRes();

    await createPayrollDraft(req, res, jest.fn());

    expect(mockBatchCreate).toHaveBeenCalledWith(expect.objectContaining({
      staff: 'staff1',
      company: 'co1',
      totalHours: 8,
      totalPay: 120,
      status: 'draft',
    }));
    expect(res.json).toHaveBeenCalledWith(createdBatch);
  });
});
