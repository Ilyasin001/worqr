import { jest } from '@jest/globals';

const mockSave = jest.fn();
const MockUser = jest.fn().mockImplementation((data) => ({ ...data, save: mockSave }));
MockUser.find               = jest.fn();
MockUser.findOne            = jest.fn();
MockUser.findOneAndUpdate   = jest.fn();
MockUser.findOneAndDelete   = jest.fn();

const mockHash = jest.fn();

jest.unstable_mockModule('../../models/user.js', () => ({ default: MockUser }));
jest.unstable_mockModule('bcrypt', () => ({ default: { hash: mockHash } }));

const {
  createUser, getUsers, getUserById, updateUser, deleteUser,
} = await import('../../controllers/userController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const selectResolve = (val) => ({ select: jest.fn().mockResolvedValue(val) });
const selectReject  = (err) => ({ select: jest.fn().mockRejectedValue(err) });

const adminCtx = { companyId: 'co1', user: { _id: { toString: () => 'admin1' }, role: 'admin' } };

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------
describe('createUser', () => {
  it('hashes the password, creates the user in-company, returns 201 without passwordHash', async () => {
    const savedData = { _id: 'uid1', name: 'Alice', email: 'a@b.com' };
    mockHash.mockResolvedValue('hashedpw');
    mockSave.mockResolvedValue({ ...savedData, toObject: () => savedData });
    const res = makeRes();

    await createUser({ ...adminCtx, body: { name: 'Alice', email: 'a@b.com', password: 'plaintext', hourlyRate: 10 } }, res, jest.fn());

    expect(mockHash).toHaveBeenCalledWith('plaintext', 10);
    expect(MockUser).toHaveBeenCalledWith(expect.objectContaining({ company: 'co1' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('passwordHash');
  });

  it('forwards save errors to next', async () => {
    mockHash.mockResolvedValue('hashedpw');
    const err = new Error('duplicate email');
    mockSave.mockRejectedValue(err);
    const next = jest.fn();

    await createUser({ ...adminCtx, body: { name: 'Alice', email: 'a@b.com', password: 'pass' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// getUsers
// ---------------------------------------------------------------------------
describe('getUsers', () => {
  it('returns this company\'s users with 200', async () => {
    const users = [{ _id: 'uid1' }];
    MockUser.find.mockReturnValue(selectResolve(users));
    const res = makeRes();

    await getUsers(adminCtx, res, jest.fn());

    expect(MockUser.find).toHaveBeenCalledWith({ company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it('forwards errors to next', async () => {
    const err = new Error('fail');
    MockUser.find.mockReturnValue(selectReject(err));
    const next = jest.fn();

    await getUsers(adminCtx, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

// ---------------------------------------------------------------------------
// getUserById
// ---------------------------------------------------------------------------
describe('getUserById', () => {
  it('lets an admin read any user in the company', async () => {
    MockUser.findOne.mockReturnValue(selectResolve({ _id: 'uid9', name: 'Alice' }));
    const res = makeRes();

    await getUserById({ ...adminCtx, params: { id: 'uid9' } }, res, jest.fn());

    expect(MockUser.findOne).toHaveBeenCalledWith({ _id: 'uid9', company: 'co1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('lets a staff member read their own profile', async () => {
    MockUser.findOne.mockReturnValue(selectResolve({ _id: 'self1' }));
    const res = makeRes();
    const ctx = { companyId: 'co1', user: { _id: { toString: () => 'self1' }, role: 'staff' } };

    await getUserById({ ...ctx, params: { id: 'self1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forbids a staff member from reading another user (403)', async () => {
    const next = jest.fn();
    const ctx = { companyId: 'co1', user: { _id: { toString: () => 'self1' }, role: 'staff' } };

    await getUserById({ ...ctx, params: { id: 'other2' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(MockUser.findOne).not.toHaveBeenCalled();
  });

  it('calls next with 404 when not found in company', async () => {
    MockUser.findOne.mockReturnValue(selectResolve(null));
    const next = jest.fn();

    await getUserById({ ...adminCtx, params: { id: 'uid9' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// ---------------------------------------------------------------------------
// updateUser
// ---------------------------------------------------------------------------
describe('updateUser', () => {
  it('returns the updated user with 200', async () => {
    MockUser.findOneAndUpdate.mockReturnValue(selectResolve({ _id: 'uid1', name: 'Bob' }));
    const res = makeRes();

    await updateUser({ ...adminCtx, params: { id: 'uid1' }, body: { name: 'Bob' } }, res, jest.fn());

    expect(MockUser.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'uid1', company: 'co1' }, expect.any(Object), expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with 404 when user not found', async () => {
    MockUser.findOneAndUpdate.mockReturnValue(selectResolve(null));
    const next = jest.fn();

    await updateUser({ ...adminCtx, params: { id: 'uid1' }, body: {} }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('calls next with 403 when admin tries to change their own role', async () => {
    const next = jest.fn();

    await updateUser({ ...adminCtx, params: { id: 'admin1' }, body: { role: 'staff' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(MockUser.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// deleteUser
// ---------------------------------------------------------------------------
describe('deleteUser', () => {
  it('returns 200 on success', async () => {
    MockUser.findOneAndDelete.mockResolvedValue({ _id: 'uid1' });
    const res = makeRes();

    await deleteUser({ ...adminCtx, params: { id: 'uid1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('calls next with 400 when deleting your own account', async () => {
    const next = jest.fn();

    await deleteUser({ ...adminCtx, params: { id: 'admin1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(MockUser.findOneAndDelete).not.toHaveBeenCalled();
  });

  it('calls next with 404 when user not found', async () => {
    MockUser.findOneAndDelete.mockResolvedValue(null);
    const next = jest.fn();

    await deleteUser({ ...adminCtx, params: { id: 'uid1' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
