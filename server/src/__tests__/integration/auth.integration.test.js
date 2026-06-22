import { startDb, clearDb, stopDb, buildApp, seedCompany } from './helper.js';
import request from 'supertest';

let app;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

// ---------------------------------------------------------------------------
// POST /api/auth/register  (staff joining via company code)
// ---------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  let code;

  beforeEach(async () => {
    const company = await seedCompany({ code: 'JOINME01' });
    code = company.code;
  });

  const body = (extra = {}) => ({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password1',
    companyCode: code,
    ...extra,
  });

  it('returns 201 with a token when the company code is valid', async () => {
    const res = await request(app).post('/api/auth/register').send(body());
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('staff');
  });

  it('returns 400 when the company code is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send(body({ companyCode: 'NOPECODE' }));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/company code/i);
  });

  it('returns 400 when the company code is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: 'jane@example.com', password: 'Password1' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/auth/register').send(body({ name: undefined }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send(body({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too weak (no uppercase/digit)', async () => {
    const res = await request(app).post('/api/auth/register').send(body({ password: 'weakpass' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send(body());
    const res = await request(app).post('/api/auth/register').send(body());
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  const creds = { email: 'login@example.com', password: 'Password1' };

  beforeEach(async () => {
    const company = await seedCompany({ code: 'LOGINCO1' });
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', companyCode: company.code, ...creds });
  });

  it('returns 200 with token on correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(creds);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 404 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });
    expect(res.status).toBe(404);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'WrongPass9' });
    expect(res.status).toBe(401);
  });
});
