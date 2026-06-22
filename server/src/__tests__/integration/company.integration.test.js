import { startDb, clearDb, stopDb, buildApp, seedCompany } from './helper.js';
import request from 'supertest';

let app;

beforeAll(async () => {
  await startDb();
  app = buildApp();
});

afterEach(clearDb);
afterAll(stopDb);

const validBody = {
  companyName: 'Acme Events',
  name: 'Owner Olivia',
  email: 'owner@acme.com',
  password: 'Password1',
};

// ---------------------------------------------------------------------------
// POST /api/companies/register
// ---------------------------------------------------------------------------
describe('POST /api/companies/register', () => {
  it('creates a company + first admin and returns a token', async () => {
    const res = await request(app).post('/api/companies/register').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.company).toBe(res.body.company._id);
    expect(res.body.company.code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/companies/register').send({ companyName: 'X' });
    expect(res.status).toBe(400);
  });

  it('returns 409 when the owner email is already taken', async () => {
    await request(app).post('/api/companies/register').send(validBody);
    const res = await request(app).post('/api/companies/register').send(validBody);
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// GET /api/companies/me  &  POST /api/companies/rotate-code
// ---------------------------------------------------------------------------
describe('company membership endpoints', () => {
  let adminToken;
  let staffToken;
  let originalCode;

  beforeEach(async () => {
    const reg = await request(app).post('/api/companies/register').send(validBody);
    adminToken = reg.body.token;
    originalCode = reg.body.company.code;

    // A staff member joins the same company.
    await request(app).post('/api/auth/register').send({
      name: 'Staff Sam',
      email: 'sam@acme.com',
      password: 'Password1',
      companyCode: originalCode,
    });
    const login = await request(app).post('/api/auth/login').send({ email: 'sam@acme.com', password: 'Password1' });
    staffToken = login.body.token;
  });

  it('returns the company with code for an admin', async () => {
    const res = await request(app).get('/api/companies/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(originalCode);
  });

  it('hides the code from staff', async () => {
    const res = await request(app).get('/api/companies/me').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('code');
  });

  it('lets an admin rotate the join code', async () => {
    const res = await request(app).post('/api/companies/rotate-code').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).not.toBe(originalCode);
  });

  it('forbids staff from rotating the code', async () => {
    const res = await request(app).post('/api/companies/rotate-code').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});
