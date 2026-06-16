import { jest } from '@jest/globals';

const mockSave = jest.fn();
const MockUser = jest.fn().mockImplementation((data) => ({ ...data, save: mockSave }));
MockUser.find              = jest.fn();
MockUser.findById          = jest.fn();
MockUser.findByIdAndUpdate = jest.fn();
MockUser.findByIdAndDelete = jest.fn();

const mockHash = jest.fn();

jest.unstable_mockModule('../../models/user.js', () => ({ default: MockUser }));
jest.unstable_mockModule('bcrypt', () => ({
  default: { hash: mockHash },
}));

const {
  createUser, getUsers, getUserById, updateUser, deleteUser,
} = await import('../../controllers/userController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

// Helpers: Mongoose find/findById/findByIdAndUpdate all chain .select()
const selectResolve = (val) => ({ select: jest.fn().mockResolvedValue(val) });
const selectReject  = (err) => ({ select: jest.fn().mockRejectedValue(err) });

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------
describe('createUser', () => {
  it('hashes the password, saves the user, and returns 201 without passwordHash', async () => {
    const savedData = { _id: 'uid1', name: 'Alice', email: 'a@b.com' };
    const saved = { ...savedData, toObject: () => savedData };
    mockHash.mockResolvedValue('hashedpw');
    mockSave.mockResolvedValue(saved);
    const res = makeRes();

    await createUser({ body: { name: 'Alice', email: 'a@b.com', password: 'plaintext', hourlyRate: 10 } }, res);

    expect(mockHash).toHaveBeenCalledWith('plaintext', 10);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(savedData);
  });

  it('strips passwordHash from the 201 response', async () => {
    const savedData = { _id: 'uid2', name: 'Bob', email: 'b@b.com', passwordHash: 'hashedpw' };
    const saved = { ...savedData, toObject: () => ({ ...savedData }) };
    mockHash.mockResolvedValue('hashedpw');
    mockSave.mockResolvedValue(saved);
    const res = makeRes();

    await createUser({ body: { name: 'Bob', email: 'b@b.com', password: 'secret123' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('passwordHash');
  });

  it('returns 400 on save error', async () => {
    mockHash.mockResolvedValue('hashedpw');
    mockSave.mockRejectedValue(new Error('duplicate email'));
    const res = makeRes();

    await createUser({ body: { name: 'Alice', email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// getUsers
// ---------------------------------------------------------------------------
describe('getUsers', () => {
  it('returns all users with 200', async () => {
    const users = [{ _id: 'uid1' }, { _id: 'uid2' }];
    MockUser.find.mockReturnValue(selectResolve(users));
    const res = makeRes();

    await getUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it('returns 500 on DB error', async () => {
    MockUser.find.mockReturnValue(selectReject(new Error('fail')));
    const res = makeRes();

    await getUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getUserById
// ---------------------------------------------------------------------------
describe('getUserById', () => {
  it('returns the user with 200', async () => {
    const user = { _id: 'uid1', name: 'Alice' };
    MockUser.findById.mockReturnValue(selectResolve(user));
    const res = makeRes();

    await getUserById({ params: { id: 'uid1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('returns 404 when user not found', async () => {
    MockUser.findById.mockReturnValue(selectResolve(null));
    const res = makeRes();

    await getUserById({ params: { id: 'uid1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockUser.findById.mockReturnValue(selectReject(new Error('fail')));
    const res = makeRes();

    await getUserById({ params: { id: 'uid1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// updateUser
// ---------------------------------------------------------------------------
describe('updateUser', () => {
  it('returns the updated user with 200', async () => {
    const updated = { _id: 'uid1', name: 'Bob' };
    MockUser.findByIdAndUpdate.mockReturnValue(selectResolve(updated));
    const res = makeRes();

    await updateUser({ params: { id: 'uid1' }, body: { name: 'Bob' }, user: { _id: { toString: () => 'other' } } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 404 when user not found', async () => {
    MockUser.findByIdAndUpdate.mockReturnValue(selectResolve(null));
    const res = makeRes();

    await updateUser({ params: { id: 'uid1' }, body: {}, user: { _id: { toString: () => 'other' } } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on validation error', async () => {
    MockUser.findByIdAndUpdate.mockReturnValue(selectReject(new Error('validation failed')));
    const res = makeRes();

    await updateUser({ params: { id: 'uid1' }, body: {}, user: { _id: { toString: () => 'other' } } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 when admin tries to change their own role', async () => {
    const res = makeRes();

    await updateUser(
      { params: { id: 'uid1' }, body: { role: 'staff' }, user: { _id: { toString: () => 'uid1' } } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(MockUser.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// deleteUser
// ---------------------------------------------------------------------------
describe('deleteUser', () => {
  it('returns 200 on success', async () => {
    MockUser.findByIdAndDelete.mockResolvedValue({ _id: 'uid1' });
    const res = makeRes();

    await deleteUser({ params: { id: 'uid1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when user not found', async () => {
    MockUser.findByIdAndDelete.mockResolvedValue(null);
    const res = makeRes();

    await deleteUser({ params: { id: 'uid1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on DB error', async () => {
    MockUser.findByIdAndDelete.mockRejectedValue(new Error('fail'));
    const res = makeRes();

    await deleteUser({ params: { id: 'uid1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
