import { jest } from '@jest/globals';

const mockSave = jest.fn();
const MockEvent = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockEvent.find              = jest.fn();
MockEvent.findById          = jest.fn();
MockEvent.findByIdAndUpdate = jest.fn();
MockEvent.findByIdAndDelete = jest.fn();

jest.unstable_mockModule('../../models/event.js', () => ({ default: MockEvent }));

const {
  createEvent, getEvents, getEventbyId, updateEvent, deleteEvent,
} = await import('../../controllers/eventController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------
describe('createEvent', () => {
  it('saves the event and returns 201', async () => {
    const saved = { _id: 'e1', title: 'Gala' };
    mockSave.mockResolvedValue(saved);
    const res = makeRes();

    await createEvent({ body: { title: 'Gala', date: '2025-06-01', createdBy: 'uid1' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it('returns 400 on save error', async () => {
    mockSave.mockRejectedValue(new Error('validation failed'));
    const res = makeRes();

    await createEvent({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// getEvents
// ---------------------------------------------------------------------------
describe('getEvents', () => {
  it('returns all events with 200', async () => {
    const events = [{ _id: 'e1' }, { _id: 'e2' }];
    MockEvent.find.mockResolvedValue(events);
    const res = makeRes();

    await getEvents({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(events);
  });

  it('returns 500 on DB error', async () => {
    MockEvent.find.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await getEvents({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getEventbyId
// ---------------------------------------------------------------------------
describe('getEventbyId', () => {
  it('returns the event with 200', async () => {
    const ev = { _id: 'e1', title: 'Gala' };
    MockEvent.findById.mockResolvedValue(ev);
    const res = makeRes();

    await getEventbyId({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(ev);
  });

  it('returns 500 on DB error', async () => {
    MockEvent.findById.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await getEventbyId({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// updateEvent
// ---------------------------------------------------------------------------
describe('updateEvent', () => {
  it('returns 200 on success', async () => {
    MockEvent.findByIdAndUpdate.mockResolvedValue({ _id: 'e1', title: 'Updated' });
    const res = makeRes();

    await updateEvent({ params: { id: 'e1' }, body: { title: 'Updated' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when event not found', async () => {
    MockEvent.findByIdAndUpdate.mockResolvedValue(null);
    const res = makeRes();

    await updateEvent({ params: { id: 'e1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockEvent.findByIdAndUpdate.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await updateEvent({ params: { id: 'e1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// deleteEvent
// ---------------------------------------------------------------------------
describe('deleteEvent', () => {
  it('returns 200 on success', async () => {
    MockEvent.findByIdAndDelete.mockResolvedValue({ _id: 'e1' });
    const res = makeRes();

    await deleteEvent({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when event not found', async () => {
    MockEvent.findByIdAndDelete.mockResolvedValue(null);
    const res = makeRes();

    await deleteEvent({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockEvent.findByIdAndDelete.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await deleteEvent({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
