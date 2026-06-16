import { jest } from '@jest/globals';

const mockSave    = jest.fn();
const MockUser    = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockUser.findOne  = jest.fn();

const mockCompare = jest.fn();
const mockGenSalt = jest.fn();
const mockHash    = jest.fn();
const mockSign    = jest.fn();

jest.unstable_mockModule('../../models/user.js', () => ({ default: MockUser }));
jest.unstable_mockModule('bcrypt', () => ({
  default: { compare: mockCompare, genSalt: mockGenSalt, hash: mockHash },
}));
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: mockSign },
}));

const { login, register } = await import('../../controllers/authController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
describe('login', () => {
  it('returns 404 when user is not found', async () => {
    MockUser.findOne.mockResolvedValue(null);
    const res = makeRes();

    await login({ body: { email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 401 when password is invalid', async () => {
    MockUser.findOne.mockResolvedValue({ _id: 'uid1', passwordHash: 'hash', role: 'staff' });
    mockCompare.mockResolvedValue(false);
    const res = makeRes();

    await login({ body: { email: 'a@b.com', password: 'wrong' } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 200 with token on success', async () => {
    const userData = { _id: 'uid1', role: 'staff' };
    const user = { ...userData, passwordHash: 'hash', toObject: () => ({ ...userData, passwordHash: 'hash' }) };
    MockUser.findOne.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue('jwt-token');
    const res = makeRes();

    await login({ body: { email: 'a@b.com', password: 'correct' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token' }));
  });

  it('returns 500 on unexpected DB error', async () => {
    MockUser.findOne.mockRejectedValue(new Error('DB down'));
    const res = makeRes();

    await login({ body: { email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
describe('register', () => {
  it('returns 400 when email is already registered', async () => {
    MockUser.findOne.mockResolvedValue({ _id: 'uid1' });
    const res = makeRes();

    await register({ body: { name: 'Alice', email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('returns 201 on successful registration', async () => {
    MockUser.findOne.mockResolvedValue(null);
    mockGenSalt.mockResolvedValue('salt');
    mockHash.mockResolvedValue('hashedpass');
    mockSave.mockResolvedValue(undefined);
    const res = makeRes();

    await register({ body: { name: 'Alice', email: 'a@b.com', password: 'pass' } }, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 500 on unexpected error', async () => {
    MockUser.findOne.mockRejectedValue(new Error('DB down'));
    const res = makeRes();

    await register({ body: { name: 'Alice', email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
