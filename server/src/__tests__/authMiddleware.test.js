import { jest } from '@jest/globals';

const mockVerify = jest.fn();
const mockFindById = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify },
}));

jest.unstable_mockModule('../models/user.js', () => ({
  default: { findById: mockFindById },
}));

const { protect, adminOnly, restrictTo } = await import('../middleware/authMiddleware.js');

// ---------------------------------------------------------------------------
// protect
// ---------------------------------------------------------------------------
describe('protect', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('returns 401 when no Authorization header is present', async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', async () => {
    req.headers.authorization = 'Bearer badtoken';
    mockVerify.mockImplementation(() => { throw new Error('invalid'); });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when decoded user does not exist in DB', async () => {
    req.headers.authorization = 'Bearer validtoken';
    mockVerify.mockReturnValue({ id: 'uid1' });
    mockFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user to req and calls next when token is valid', async () => {
    const user = { _id: 'uid1', role: 'staff' };
    req.headers.authorization = 'Bearer validtoken';
    mockVerify.mockReturnValue({ id: 'uid1' });
    mockFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    await protect(req, res, next);

    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// adminOnly
// ---------------------------------------------------------------------------
describe('adminOnly', () => {
  let res, next;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('returns 403 for non-admin role', () => {
    adminOnly({ user: { role: 'staff' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for admin role', () => {
    adminOnly({ user: { role: 'admin' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// restrictTo
// ---------------------------------------------------------------------------
describe('restrictTo', () => {
  let res, next;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('returns 403 when user role is not in the allowed list', () => {
    restrictTo('admin', 'manager')({ user: { role: 'staff' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user role is in the allowed list', () => {
    restrictTo('admin', 'manager')({ user: { role: 'manager' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
