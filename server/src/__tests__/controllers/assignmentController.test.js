import { jest } from '@jest/globals';

const MockAssignment = jest.fn();
MockAssignment.create           = jest.fn();
MockAssignment.find             = jest.fn();
MockAssignment.findOne          = jest.fn();
MockAssignment.findOneAndUpdate = jest.fn();
MockAssignment.findOneAndDelete = jest.fn();

const MockShift = { findOne: jest.fn() };
const MockUser  = { findOne: jest.fn() };

jest.unstable_mockModule('../../models/assignment.js', () => ({ default: MockAssignment }));
jest.unstable_mockModule('../../models/shift.js', () => ({ default: MockShift }));
jest.unstable_mockModule('../../models/user.js',  () => ({ default: MockUser }));

const {
  createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment,
} = await import('../../controllers/assignmentController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const ctx = { companyId: 'co1' };

// ---------------------------------------------------------------------------
// createAssignment
// ---------------------------------------------------------------------------
describe('createAssignment', () => {
  it('creates the assignment when shift + staff are in-company, returns 201', async () => {
    MockShift.findOne.mockResolvedValue({ _id: 's1' });
    MockUser.findOne.mockResolvedValue({ _id: 'uid1' });
    const saved = { _id: 'a1' };
    MockAssignment.create.mockResolvedValue(saved);
    const res = makeRes();

    await createAssignment({ ...ctx, body: { shiftId: 's1', staffId: 'uid1', hourlyRate: 12.5 } }, res, jest.fn());

    expect(MockAssignment.create).toHaveBeenCalledWith(expect.objectContaining({ company: 'co1' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('calls next with 400 when the staff member is not in the company', async () => {
    MockShift.findOne.mockResolvedValue({ _id: 's1' });
    MockUser.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await createAssignment({ ...ctx, body: { shiftId: 's1', staffId: 'uid1', hourlyRate: 12.5 } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(MockAssignment.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getAssignments
// ---------------------------------------------------------------------------
describe('getAssignments', () => {
  it('returns this company\'s assignments with 200', async () => {
    const assignments = [{ _id: 'a1' }];
    MockAssignment.find.mockResolvedValue(assignments);
    const res = makeRes();

    await getAssignments(ctx, res, jest.fn());

    expect(MockAssignment.find).toHaveBeenCalledWith({ company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(assignments);
  });

  it('forwards errors to next', async () => {
    const err = new Error('fail');
    MockAssignment.find.mockRejectedValue(err);
    const next = jest.fn();

    await getAssignments(ctx, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// getAssignmentById
// ---------------------------------------------------------------------------
describe('getAssignmentById', () => {
  it('returns the assignment with 200', async () => {
    MockAssignment.findOne.mockResolvedValue({ _id: 'a1' });
    const res = makeRes();

    await getAssignmentById({ ...ctx, params: { id: 'a1' } }, res, jest.fn());

    expect(MockAssignment.findOne).toHaveBeenCalledWith({ _id: 'a1', company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with 404 when not found', async () => {
    MockAssignment.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await getAssignmentById({ ...ctx, params: { id: 'a1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// ---------------------------------------------------------------------------
// updateAssignment
// ---------------------------------------------------------------------------
describe('updateAssignment', () => {
  it('returns the updated assignment with 200 (no ref change)', async () => {
    const updated = { _id: 'a1', isPaid: true };
    MockAssignment.findOneAndUpdate.mockResolvedValue(updated);
    const res = makeRes();

    await updateAssignment({ ...ctx, params: { id: 'a1' }, body: { isPaid: true } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('calls next with 404 when not found', async () => {
    MockAssignment.findOneAndUpdate.mockResolvedValue(null);
    const next = jest.fn();

    await updateAssignment({ ...ctx, params: { id: 'a1' }, body: {} }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// ---------------------------------------------------------------------------
// deleteAssignment
// ---------------------------------------------------------------------------
describe('deleteAssignment', () => {
  it('returns 200 on success', async () => {
    MockAssignment.findOneAndDelete.mockResolvedValue({ _id: 'a1' });
    const res = makeRes();

    await deleteAssignment({ ...ctx, params: { id: 'a1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with 404 when not found', async () => {
    MockAssignment.findOneAndDelete.mockResolvedValue(null);
    const next = jest.fn();

    await deleteAssignment({ ...ctx, params: { id: 'a1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
