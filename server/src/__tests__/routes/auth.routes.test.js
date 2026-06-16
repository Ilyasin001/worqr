import { jest } from '@jest/globals';
import express from 'express';

// Auth routes are public — no protect middleware, but we still need to mock
// the User model and bcrypt that the auth controller uses.
const mockFindOne = jest.fn();
const mockSave    = jest.fn();
const MockUser    = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockUser.findOne  = mockFindOne;

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

const { default: authRouter }  = await import('../../routes/authRoutes.js');
const { default: request }     = await import('supertest');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'not-an-email', password: 'Password1' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too weak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'a@b.com', password: 'weak' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is already registered', async () => {
    mockFindOne.mockResolvedValue({ _id: 'uid1' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'a@b.com', password: 'Password1' });
    expect(res.status).toBe(400);
  });

  it('returns 201 on successful registration', async () => {
    mockFindOne.mockResolvedValue(null);
    mockGenSalt.mockResolvedValue('salt');
    mockHash.mockResolvedValue('hashedpw');
    mockSave.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'a@b.com', password: 'Password1' });
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when user is not found', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass' });
    expect(res.status).toBe(404);
  });

  it('returns 401 when password is wrong', async () => {
    mockFindOne.mockResolvedValue({ _id: 'uid1', passwordHash: 'hash', role: 'staff' });
    mockCompare.mockResolvedValue(false);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with a token on success', async () => {
    const user = { _id: 'uid1', passwordHash: 'hash', role: 'staff' };
    mockFindOne.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue('jwt-token');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'jwt-token');
  });
});
