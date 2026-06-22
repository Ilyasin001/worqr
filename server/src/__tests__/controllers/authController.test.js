import { jest } from '@jest/globals';

const mockSave    = jest.fn();
const MockUser    = jest.fn().mockImplementation((data) => ({ ...data, save: mockSave, toObject: () => ({ ...data }) }));
MockUser.findOne  = jest.fn();

const MockCompany = { findOne: jest.fn() };

const mockCompare = jest.fn();
const mockGenSalt = jest.fn();
const mockHash    = jest.fn();
const mockSign    = jest.fn();

jest.unstable_mockModule('../../models/user.js', () => ({ default: MockUser }));
jest.unstable_mockModule('../../models/company.js', () => ({ default: MockCompany }));
jest.unstable_mockModule('bcrypt', () => ({
  default: { compare: mockCompare, genSalt: mockGenSalt, hash: mockHash },
}));
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: mockSign },
}));
jest.unstable_mockModule('../../services/refreshTokens.js', () => ({
  issueRefreshToken: jest.fn().mockResolvedValue('refresh-raw'),
  rotateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
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

  it('returns 200 with a company-scoped token on success', async () => {
    const userData = { _id: 'uid1', role: 'staff', company: 'co1' };
    const user = { ...userData, passwordHash: 'hash', toObject: () => ({ ...userData, passwordHash: 'hash' }) };
    MockUser.findOne.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue('jwt-token');
    const res = makeRes();

    await login({ body: { email: 'a@b.com', password: 'correct' } }, res);

    expect(mockSign.mock.calls[0][0]).toEqual(expect.objectContaining({ companyId: 'co1' }));
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
  it('returns 400 when the company code is invalid', async () => {
    MockCompany.findOne.mockResolvedValue(null);
    const res = makeRes();

    await register({ body: { name: 'Alice', email: 'a@b.com', password: 'pass', companyCode: 'BAD' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('returns 409 when email is already registered', async () => {
    MockCompany.findOne.mockResolvedValue({ _id: 'co1' });
    MockUser.findOne.mockResolvedValue({ _id: 'uid1' });
    const res = makeRes();

    await register({ body: { name: 'Alice', email: 'a@b.com', password: 'pass', companyCode: 'GOOD' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('returns 201 with a token, linked to the company, role forced to staff', async () => {
    MockCompany.findOne.mockResolvedValue({ _id: 'co1' });
    MockUser.findOne.mockResolvedValue(null);
    mockGenSalt.mockResolvedValue('salt');
    mockHash.mockResolvedValue('hashedpass');
    mockSave.mockResolvedValue(undefined);
    mockSign.mockReturnValue('jwt-token');
    const res = makeRes();

    await register({ body: { name: 'Alice', email: 'a@b.com', password: 'pass', companyCode: 'GOOD' } }, res);

    expect(MockUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'staff', company: 'co1' }));
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'jwt-token' }));
  });

  it('returns 500 on unexpected error', async () => {
    MockCompany.findOne.mockRejectedValue(new Error('DB down'));
    const res = makeRes();

    await register({ body: { name: 'Alice', email: 'a@b.com', password: 'pass', companyCode: 'GOOD' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
