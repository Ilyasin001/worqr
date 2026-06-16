import { jest } from '@jest/globals';

const mockSave = jest.fn();
const MockShift = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockShift.find              = jest.fn();
MockShift.findById          = jest.fn();
MockShift.findByIdAndUpdate = jest.fn();
MockShift.findByIdAndDelete = jest.fn();

jest.unstable_mockModule('../../models/shift.js', () => ({ default: MockShift }));

const {
  createShift, getShifts, getShiftById, updateShift, deleteShift,
} = await import('../../controllers/shiftController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

// ---------------------------------------------------------------------------
// createShift
// ---------------------------------------------------------------------------
describe('createShift', () => {
  it('saves the shift and returns 201', async () => {
    const saved = { _id: 's1', startTime: '09:00' };
    mockSave.mockResolvedValue(saved);
    const res = makeRes();

    await createShift({
      body: { managerId: 'uid1', startTime: '2025-01-01T09:00:00Z', endTime: '2025-01-01T17:00:00Z', eventId: 'ev1' },
    }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('returns 400 on save error', async () => {
    mockSave.mockRejectedValue(new Error('validation failed'));
    const res = makeRes();

    await createShift({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// getShifts
// ---------------------------------------------------------------------------
describe('getShifts', () => {
  it('returns all shifts with 200', async () => {
    const shifts = [{ _id: 's1' }, { _id: 's2' }];
    MockShift.find.mockResolvedValue(shifts);
    const res = makeRes();

    await getShifts({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(shifts);
  });

  it('returns 500 on DB error', async () => {
    MockShift.find.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await getShifts({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getShiftById
// ---------------------------------------------------------------------------
describe('getShiftById', () => {
  it('returns the shift with 200', async () => {
    const shift = { _id: 's1' };
    MockShift.findById.mockResolvedValue(shift);
    const res = makeRes();

    await getShiftById({ params: { id: 's1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(shift);
  });

  it('returns 404 when shift not found', async () => {
    MockShift.findById.mockResolvedValue(null);
    const res = makeRes();

    await getShiftById({ params: { id: 's1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockShift.findById.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await getShiftById({ params: { id: 's1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// updateShift
// ---------------------------------------------------------------------------
describe('updateShift', () => {
  it('returns the updated shift with 200', async () => {
    const updated = { _id: 's1', confirmed: true };
    MockShift.findByIdAndUpdate.mockResolvedValue(updated);
    const res = makeRes();

    await updateShift({ params: { id: 's1' }, body: { confirmed: true } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 404 when shift not found', async () => {
    MockShift.findByIdAndUpdate.mockResolvedValue(null);
    const res = makeRes();

    await updateShift({ params: { id: 's1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on validation error', async () => {
    MockShift.findByIdAndUpdate.mockRejectedValue(new Error('validation failed'));
    const res = makeRes();

    await updateShift({ params: { id: 's1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// deleteShift
// ---------------------------------------------------------------------------
describe('deleteShift', () => {
  it('returns 200 on success', async () => {
    MockShift.findByIdAndDelete.mockResolvedValue({ _id: 's1' });
    const res = makeRes();

    await deleteShift({ params: { id: 's1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when shift not found', async () => {
    MockShift.findByIdAndDelete.mockResolvedValue(null);
    const res = makeRes();

    await deleteShift({ params: { id: 's1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockShift.findByIdAndDelete.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await deleteShift({ params: { id: 's1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
