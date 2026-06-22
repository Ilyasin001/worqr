import { jest } from '@jest/globals';

const MockEvent = jest.fn();
MockEvent.create            = jest.fn();
MockEvent.find              = jest.fn();
MockEvent.findOne           = jest.fn();
MockEvent.findOneAndUpdate  = jest.fn();
MockEvent.findOneAndDelete  = jest.fn();

jest.unstable_mockModule('../../models/event.js', () => ({ default: MockEvent }));

const {
  createEvent, getEvents, getEventbyId, updateEvent, deleteEvent,
} = await import('../../controllers/eventController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const ctx = { user: { _id: 'uid1' }, companyId: 'co1' };

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------
describe('createEvent', () => {
  it('creates the event scoped to the company and returns 201', async () => {
    const saved = { _id: 'e1', title: 'Gala' };
    MockEvent.create.mockResolvedValue(saved);
    const res = makeRes();

    await createEvent({ ...ctx, body: { title: 'Gala', date: '2025-06-01' } }, res, jest.fn());

    expect(MockEvent.create).toHaveBeenCalledWith(expect.objectContaining({ company: 'co1', createdBy: 'uid1' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('forwards errors to next', async () => {
    const err = new Error('validation failed');
    MockEvent.create.mockRejectedValue(err);
    const next = jest.fn();

    await createEvent({ ...ctx, body: {} }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// getEvents
// ---------------------------------------------------------------------------
describe('getEvents', () => {
  it('returns only this company\'s events with 200', async () => {
    const events = [{ _id: 'e1' }, { _id: 'e2' }];
    MockEvent.find.mockResolvedValue(events);
    const res = makeRes();

    await getEvents(ctx, res, jest.fn());

    expect(MockEvent.find).toHaveBeenCalledWith({ company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(events);
  });

  it('forwards errors to next', async () => {
    const err = new Error('fail');
    MockEvent.find.mockRejectedValue(err);
    const next = jest.fn();

    await getEvents(ctx, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// getEventbyId
// ---------------------------------------------------------------------------
describe('getEventbyId', () => {
  it('returns the event with 200', async () => {
    const ev = { _id: 'e1', title: 'Gala' };
    MockEvent.findOne.mockResolvedValue(ev);
    const res = makeRes();

    await getEventbyId({ ...ctx, params: { id: 'e1' } }, res, jest.fn());

    expect(MockEvent.findOne).toHaveBeenCalledWith({ _id: 'e1', company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(ev);
  });

  it('calls next with a 404 when not found in company', async () => {
    MockEvent.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await getEventbyId({ ...ctx, params: { id: 'e1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// ---------------------------------------------------------------------------
// updateEvent
// ---------------------------------------------------------------------------
describe('updateEvent', () => {
  it('returns 200 on success', async () => {
    MockEvent.findOneAndUpdate.mockResolvedValue({ _id: 'e1', title: 'Updated' });
    const res = makeRes();

    await updateEvent({ ...ctx, params: { id: 'e1' }, body: { title: 'Updated' } }, res, jest.fn());

    expect(MockEvent.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'e1', company: 'co1' }, expect.any(Object), expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with a 404 when not found', async () => {
    MockEvent.findOneAndUpdate.mockResolvedValue(null);
    const next = jest.fn();

    await updateEvent({ ...ctx, params: { id: 'e1' }, body: {} }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// ---------------------------------------------------------------------------
// deleteEvent
// ---------------------------------------------------------------------------
describe('deleteEvent', () => {
  it('returns 200 on success', async () => {
    MockEvent.findOneAndDelete.mockResolvedValue({ _id: 'e1' });
    const res = makeRes();

    await deleteEvent({ ...ctx, params: { id: 'e1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with a 404 when not found', async () => {
    MockEvent.findOneAndDelete.mockResolvedValue(null);
    const next = jest.fn();

    await deleteEvent({ ...ctx, params: { id: 'e1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
