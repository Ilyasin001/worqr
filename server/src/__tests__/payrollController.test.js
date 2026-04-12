import { jest } from '@jest/globals';

// --- mock setup (must precede dynamic import of the module under test) ------

const mockBatchFindById = jest.fn();
const mockBatchFindOne  = jest.fn();
const mockBatchCreate   = jest.fn();
const mockAssignmentUpdateMany = jest.fn();
const mockStartSession  = jest.fn();
const mockCalculatePayrollPreview = jest.fn();

jest.unstable_mockModule('../models/payrollBatch.js', () => ({
  default: {
    findById: mockBatchFindById,
    findOne:  mockBatchFindOne,
    create:   mockBatchCreate,
  },
}));

jest.unstable_mockModule('../models/assignment.js', () => ({
  default: { updateMany: mockAssignmentUpdateMany },
}));

jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: mockStartSession },
}));

jest.unstable_mockModule('../services/payrollService.js', () => ({
  calculatePayrollPreview: mockCalculatePayrollPreview,
}));

const { approvePayroll, finalizePayroll, createPayrollDraft } = await import('../controllers/payrollController.js');

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

// ---------------------------------------------------------------------------
// approvePayroll
// ---------------------------------------------------------------------------
describe('approvePayroll', () => {
  it('returns 404 when batch does not exist', async () => {
    mockBatchFindById.mockResolvedValue(null);
    const res = makeRes();

    await approvePayroll({ params: { id: 'b1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when batch is not in draft status', async () => {
    mockBatchFindById.mockResolvedValue({ status: 'approved', save: jest.fn() });
    const res = makeRes();

    await approvePayroll({ params: { id: 'b1' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sets status to approved and saves on success', async () => {
    const batch = { status: 'draft', save: jest.fn().mockResolvedValue(undefined) };
    mockBatchFindById.mockResolvedValue(batch);
    const res = makeRes();

    await approvePayroll({ params: { id: 'b1' } }, res);

    expect(batch.status).toBe('approved');
    expect(batch.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payroll approved' }));
  });
});

// ---------------------------------------------------------------------------
// finalizePayroll
// ---------------------------------------------------------------------------
describe('finalizePayroll', () => {
  it('returns 404 when batch does not exist', async () => {
    mockBatchFindById.mockResolvedValue(null);
    const res = makeRes();

    await finalizePayroll({ params: { id: 'b1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when batch is not approved', async () => {
    mockBatchFindById.mockResolvedValue({ status: 'draft', save: jest.fn() });
    const res = makeRes();

    await finalizePayroll({ params: { id: 'b1' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('marks assignments paid and sets batch status to paid on success', async () => {
    const batch = {
      status: 'approved',
      assignments: ['a1', 'a2'],
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockBatchFindById.mockResolvedValue(batch);
    mockAssignmentUpdateMany.mockResolvedValue({});
    const session = makeSession();
    mockStartSession.mockResolvedValue(session);
    const res = makeRes();

    await finalizePayroll({ params: { id: 'b1' } }, res);

    expect(mockAssignmentUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: batch.assignments } },
      expect.objectContaining({ $set: expect.objectContaining({ isPaid: true }) }),
      expect.objectContaining({ session }),
    );
    expect(batch.status).toBe('paid');
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payroll completed' }));
  });

  it('aborts the transaction and returns 500 on DB error', async () => {
    const batch = { status: 'approved', assignments: [], save: jest.fn() };
    mockBatchFindById.mockResolvedValue(batch);
    mockAssignmentUpdateMany.mockRejectedValue(new Error('DB error'));
    const session = makeSession();
    mockStartSession.mockResolvedValue(session);
    const res = makeRes();

    await finalizePayroll({ params: { id: 'b1' } }, res);

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// createPayrollDraft
// ---------------------------------------------------------------------------
describe('createPayrollDraft', () => {
  const req = {
    body: { staffId: 'staff1', periodStart: '2025-01-01', periodEnd: '2025-01-31' },
    user: { userId: 'admin1' },
  };

  it('returns 400 when a draft or approved batch already exists for the period', async () => {
    mockCalculatePayrollPreview.mockResolvedValue({ totalHours: 8, totalPay: 120, assignments: [] });
    mockBatchFindOne.mockResolvedValue({ _id: 'existing' });
    const res = makeRes();

    await createPayrollDraft(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockBatchCreate).not.toHaveBeenCalled();
  });

  it('creates and returns a new draft batch when none exists', async () => {
    const preview = {
      totalHours: 8,
      totalPay: 120,
      assignments: [{ _id: 'a1' }],
    };
    const createdBatch = { _id: 'b1', status: 'draft' };
    mockCalculatePayrollPreview.mockResolvedValue(preview);
    mockBatchFindOne.mockResolvedValue(null);
    mockBatchCreate.mockResolvedValue(createdBatch);
    const res = makeRes();

    await createPayrollDraft(req, res);

    expect(mockBatchCreate).toHaveBeenCalledWith(expect.objectContaining({
      staff: 'staff1',
      totalHours: 8,
      totalPay: 120,
      status: 'draft',
    }));
    expect(res.json).toHaveBeenCalledWith(createdBatch);
  });
});
