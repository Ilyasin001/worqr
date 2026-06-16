import { jest } from '@jest/globals';

const mockSave = jest.fn();
const MockAssignment = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockAssignment.find              = jest.fn();
MockAssignment.findById          = jest.fn();
MockAssignment.findByIdAndUpdate = jest.fn();
MockAssignment.findByIdAndDelete = jest.fn();

jest.unstable_mockModule('../../models/assignment.js', () => ({ default: MockAssignment }));

const {
  createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment,
} = await import('../../controllers/assignmentController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

// ---------------------------------------------------------------------------
// createAssignment
// ---------------------------------------------------------------------------
describe('createAssignment', () => {
  it('saves the assignment and returns 201', async () => {
    const saved = { _id: 'a1', shiftId: 's1', staffId: 'uid1' };
    mockSave.mockResolvedValue(saved);
    const res = makeRes();

    await createAssignment({ body: { shiftId: 's1', staffId: 'uid1', hourlyRate: 12.5, breakDuration: 30 } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('returns 400 on save error', async () => {
    mockSave.mockRejectedValue(new Error('validation failed'));
    const res = makeRes();

    await createAssignment({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// getAssignments
// ---------------------------------------------------------------------------
describe('getAssignments', () => {
  it('returns all assignments with 200', async () => {
    const assignments = [{ _id: 'a1' }, { _id: 'a2' }];
    MockAssignment.find.mockResolvedValue(assignments);
    const res = makeRes();

    await getAssignments({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(assignments);
  });

  it('returns 500 on DB error', async () => {
    MockAssignment.find.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await getAssignments({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getAssignmentById
// ---------------------------------------------------------------------------
describe('getAssignmentById', () => {
  it('returns the assignment with 200', async () => {
    const assignment = { _id: 'a1' };
    MockAssignment.findById.mockResolvedValue(assignment);
    const res = makeRes();

    await getAssignmentById({ params: { id: 'a1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(assignment);
  });

  it('returns 404 when not found', async () => {
    MockAssignment.findById.mockResolvedValue(null);
    const res = makeRes();

    await getAssignmentById({ params: { id: 'a1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockAssignment.findById.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await getAssignmentById({ params: { id: 'a1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// updateAssignment
// ---------------------------------------------------------------------------
describe('updateAssignment', () => {
  it('returns the updated assignment with 200', async () => {
    const updated = { _id: 'a1', isPaid: true };
    MockAssignment.findByIdAndUpdate.mockResolvedValue(updated);
    const res = makeRes();

    await updateAssignment({ params: { id: 'a1' }, body: { isPaid: true } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 404 when not found', async () => {
    MockAssignment.findByIdAndUpdate.mockResolvedValue(null);
    const res = makeRes();

    await updateAssignment({ params: { id: 'a1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on validation error', async () => {
    MockAssignment.findByIdAndUpdate.mockRejectedValue(new Error('validation failed'));
    const res = makeRes();

    await updateAssignment({ params: { id: 'a1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// deleteAssignment
// ---------------------------------------------------------------------------
describe('deleteAssignment', () => {
  it('returns 200 on success', async () => {
    MockAssignment.findByIdAndDelete.mockResolvedValue({ _id: 'a1' });
    const res = makeRes();

    await deleteAssignment({ params: { id: 'a1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when not found', async () => {
    MockAssignment.findByIdAndDelete.mockResolvedValue(null);
    const res = makeRes();

    await deleteAssignment({ params: { id: 'a1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockAssignment.findByIdAndDelete.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await deleteAssignment({ params: { id: 'a1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
