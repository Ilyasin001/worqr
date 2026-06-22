import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import express from 'express';
import cors from 'cors';

import authRoutes from '../../routes/authRoutes.js';
import userRoutes from '../../routes/userRoutes.js';
import eventRoutes from '../../routes/eventRoutes.js';
import shiftRoutes from '../../routes/shiftRoutes.js';
import assignmentRoutes from '../../routes/assignmentRoutes.js';
import payrollRoutes from '../../routes/payrollRoutes.js';
import companyRoutes from '../../routes/companyRoutes.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

import Company from '../../models/company.js';
import User from '../../models/user.js';
import Event from '../../models/event.js';
import Shift from '../../models/shift.js';

let mongod;

export async function startDb() {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRATION = '1h';

  // Replica set (single node) so Mongoose transactions work in tests.
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

export async function clearDb() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function stopDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/shifts', shiftRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/companies', companyRoutes);

  app.use(errorHandler);

  return app;
}

export function makeAdminToken(userId, companyId) {
  return jwt.sign({ id: userId, role: 'admin', companyId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function makeStaffToken(userId, companyId) {
  return jwt.sign({ id: userId, role: 'staff', companyId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Creates a company with a placeholder owner id; the real owner is seeded next.
let companyCounter = 0;

export async function seedCompany(overrides = {}) {
  const ownerId = new mongoose.Types.ObjectId();
  const company = await Company.create({
    name: overrides.name ?? 'Test Co',
    code: overrides.code ?? `TESTCO${(companyCounter++).toString().padStart(2, '0')}`,
    owner: ownerId,
  });
  return company;
}

export async function seedAdmin(company) {
  const co = company ?? (await seedCompany());
  const passwordHash = await bcrypt.hash('Password1', 4);
  const user = await User.create({
    name: 'Admin User',
    email: `admin-${co._id}@test.com`,
    passwordHash,
    role: 'admin',
    company: co._id,
  });
  const token = makeAdminToken(user._id.toString(), co._id.toString());
  return { user, token, company: co };
}

export async function seedStaff(company) {
  const co = company ?? (await seedCompany());
  const passwordHash = await bcrypt.hash('Password1', 4);
  const user = await User.create({
    name: 'Staff User',
    email: `staff-${co._id}@test.com`,
    passwordHash,
    role: 'staff',
    company: co._id,
  });
  const token = makeStaffToken(user._id.toString(), co._id.toString());
  return { user, token, company: co };
}

export async function seedStaffUser(company) {
  const co = company ?? (await seedCompany());
  const passwordHash = await bcrypt.hash('Password1', 4);
  const user = await User.create({
    name: 'Another Staff',
    email: `anotherstaff-${co._id}@test.com`,
    passwordHash,
    role: 'staff',
    company: co._id,
  });
  return user;
}

export async function seedEvent(adminId, companyId) {
  const ev = await Event.create({
    title: 'Test Event',
    date: new Date('2026-08-01'),
    createdBy: adminId,
    company: companyId,
    status: 'pending',
  });
  return ev;
}

export async function seedShift(adminId, eventId, companyId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(17, 0, 0, 0);

  const shift = await Shift.create({
    managerId: adminId,
    eventId,
    company: companyId,
    startTime: tomorrow,
    endTime: tomorrowEnd,
    confirmed: false,
  });
  return shift;
}
