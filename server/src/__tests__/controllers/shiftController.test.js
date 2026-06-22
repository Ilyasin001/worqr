import { jest } from '@jest/globals';

const MockShift = jest.fn();
MockShift.create           = jest.fn();
MockShift.find             = jest.fn();
MockShift.findOne          = jest.fn();
MockShift.findOneAndUpdate = jest.fn();
MockShift.findOneAndDelete = jest.fn();

const MockEvent = { findOne: jest.fn() };
const MockUser  = { findOne: jest.fn() };

jest.unstable_mockModule('../../models/shift.js', () => ({ default: MockShift }));
jest.unstable_mockModule('../../models/event.js', () => ({ default: MockEvent }));
jest.unstable_mockModule('../../models/user.js',  () => ({ default: MockUser }));

const {
  createShift, getShifts, getShiftById, updateShift, deleteShift,
} = await import('../../controllers/shiftController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const ctx = { companyId: 'co1', query: {} };

// ---------------------------------------------------------------------------
// createShift
// ---------------------------------------------------------------------------
describe('createShift', () => {
  it('creates the shift when event + manager are in-company, returns 201', async () => {
    MockEvent.findOne.mockResolvedValue({ _id: 'ev1' });
    MockUser.findOne.mockResolvedValue({ _id: 'uid1' });
    const saved = { _id: 's1' };
    MockShift.create.mockResolvedValue(saved);
    const res = makeRes();

    await createShift({
      ...ctx,
      body: { managerId: 'uid1', eventId: 'ev1', startTime: '2025-01-01T09:00:00Z', endTime: '2025-01-01T17:00:00Z' },
    }, res, jest.fn());

    expect(MockShift.create).toHaveBeenCalledWith(expect.objectContaining({ company: 'co1' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('calls next with 400 when the event is not in the company', async () => {
    MockEvent.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await createShift({ ...ctx, body: { managerId: 'uid1', eventId: 'ev1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(MockShift.create).not.toHaveBeenCalled();
  });

  it('forwards unexpected errors to next', async () => {
    MockEvent.findOne.mockResolvedValue({ _id: 'ev1' });
    MockUser.findOne.mockResolvedValue({ _id: 'uid1' });
    const err = new Error('fail');
    MockShift.create.mockRejectedValue(err);
    const next = jest.fn();

    await createShift({ ...ctx, body: { managerId: 'uid1', eventId: 'ev1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// getShifts
// ---------------------------------------------------------------------------
describe('getShifts', () => {
  it('returns this company\'s shifts with 200', async () => {
    const shifts = [{ _id: 's1' }];
    MockShift.find.mockReturnValue({ sort: () => Promise.resolve(shifts) });
    const res = makeRes();

    await getShifts(ctx, res, jest.fn());

    expect(MockShift.find).toHaveBeenCalledWith(expect.objectContaining({ company: 'co1' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(shifts);
  });

  it('forwards errors to next', async () => {
    const err = new Error('fail');
    MockShift.find.mockReturnValue({ sort: () => Promise.reject(err) });
    const next = jest.fn();

    await getShifts(ctx, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// getShiftById
// ---------------------------------------------------------------------------
describe('getShiftById', () => {
  it('returns the shift with 200', async () => {
    MockShift.findOne.mockResolvedValue({ _id: 's1' });
    const res = makeRes();

    await getShiftById({ ...ctx, params: { id: 's1' } }, res, jest.fn());

    expect(MockShift.findOne).toHaveBeenCalledWith({ _id: 's1', company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with 404 when not found', async () => {
    MockShift.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await getShiftById({ ...ctx, params: { id: 's1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// ---------------------------------------------------------------------------
// updateShift
// ---------------------------------------------------------------------------
describe('updateShift', () => {
  it('returns the updated shift with 200 (no ref change)', async () => {
    const updated = { _id: 's1', confirmed: true };
    MockShift.findOneAndUpdate.mockResolvedValue(updated);
    const res = makeRes();

    await updateShift({ ...ctx, params: { id: 's1' }, body: { confirmed: true } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('calls next with 404 when not found', async () => {
    MockShift.findOneAndUpdate.mockResolvedValue(null);
    const next = jest.fn();

    await updateShift({ ...ctx, params: { id: 's1' }, body: {} }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// ---------------------------------------------------------------------------
// deleteShift
// ---------------------------------------------------------------------------
describe('deleteShift', () => {
  it('returns 200 on success', async () => {
    MockShift.findOneAndDelete.mockResolvedValue({ _id: 's1' });
    const res = makeRes();

    await deleteShift({ ...ctx, params: { id: 's1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with 404 when not found', async () => {
    MockShift.findOneAndDelete.mockResolvedValue(null);
    const next = jest.fn();

    await deleteShift({ ...ctx, params: { id: 's1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
