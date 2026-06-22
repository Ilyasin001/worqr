import { startDb, clearDb, stopDb, buildApp, seedStaff } from './helper.js';
import request from 'supertest';
import User from '../../models/user.js';
import { hashToken } from '../../utils/secureToken.js';

let app;
let token;
let user;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

beforeEach(async () => {
  const staff = await seedStaff();          // password is 'Password1'
  token = staff.token;
  user = staff.user;
});

// ---------------------------------------------------------------------------
// GET / PATCH /api/auth/me
// ---------------------------------------------------------------------------
describe('profile', () => {
  it('GET /me returns the current user without sensitive fields', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(user._id.toString());
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('resetTokenHash');
  });

  it('GET /me requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('PATCH /me updates name and address', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed', address: '1 New St' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.address).toBe('1 New St');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
// ---------------------------------------------------------------------------
describe('change password', () => {
  it('rejects an incorrect current password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass1', newPassword: 'NewPass123' });
    expect(res.status).toBe(400);
  });

  it('changes the password and lets the user log in with the new one', async () => {
    const change = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password1', newPassword: 'NewPass123' });
    expect(change.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'NewPass123' });
    expect(login.status).toBe(200);
  });

  it('rejects a weak new password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password1', newPassword: 'weak' });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------
describe('password reset', () => {
  it('forgot-password returns a generic 200 even for unknown emails', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@nowhere.com' });
    expect(res.status).toBe(200);
  });

  it('forgot-password stores a reset token for a known email', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const fresh = await User.findById(user._id).select('+resetTokenHash +resetExpires');
    expect(fresh.resetTokenHash).toBeTruthy();
    expect(fresh.resetExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it('resets the password with a valid token', async () => {
    // Simulate the emailed token by storing its hash directly.
    await User.findByIdAndUpdate(user._id, {
      resetTokenHash: hashToken('rawreset'),
      resetExpires: new Date(Date.now() + 60_000),
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'rawreset', password: 'ResetPass1' });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'ResetPass1' });
    expect(login.status).toBe(200);
  });

  it('rejects an invalid or expired reset token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'doesnotexist', password: 'ResetPass1' });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------
describe('email verification', () => {
  it('verifies the email with a valid token', async () => {
    await User.findByIdAndUpdate(user._id, {
      verificationTokenHash: hashToken('rawverify'),
      verificationExpires: new Date(Date.now() + 60_000),
    });

    const res = await request(app).post('/api/auth/verify-email').send({ token: 'rawverify' });
    expect(res.status).toBe(200);

    const fresh = await User.findById(user._id);
    expect(fresh.isVerified).toBe(true);
  });

  it('rejects an invalid verification token', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'bad' });
    expect(res.status).toBe(400);
  });

  it('resend-verification issues a fresh token for an unverified user', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const fresh = await User.findById(user._id).select('+verificationTokenHash');
    expect(fresh.verificationTokenHash).toBeTruthy();
  });

  it('resend-verification is a 400 once already verified', async () => {
    await User.findByIdAndUpdate(user._id, { isVerified: true });
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
