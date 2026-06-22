import { startDb, clearDb, stopDb, buildApp, seedStaff } from './helper.js';
import request from 'supertest';

let app;
let email;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

beforeEach(async () => {
  const staff = await seedStaff();   // password is 'Password1'
  email = staff.user.email;
});

const login = () => request(app).post('/api/auth/login').send({ email, password: 'Password1' });

describe('login issues a refresh token', () => {
  it('returns both an access token and a refresh token', async () => {
    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });
});

describe('POST /api/auth/refresh', () => {
  it('exchanges a valid refresh token for a new access + refresh token', async () => {
    const { body } = await login();
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(body.refreshToken); // rotated
  });

  it('invalidates the old refresh token after rotation', async () => {
    const { body } = await login();
    await request(app).post('/api/auth/refresh').send({ refreshToken: body.refreshToken });
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('rejects an invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when no refresh token is provided', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the refresh token so it can no longer be used', async () => {
    const { body } = await login();
    const out = await request(app).post('/api/auth/logout').send({ refreshToken: body.refreshToken });
    expect(out.status).toBe(200);

    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('is idempotent (200 even without a token)', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(200);
  });
});
