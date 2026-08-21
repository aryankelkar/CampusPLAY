import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

let mongod;

export const app = createApp();

/** Unique client IP per auth call so the rate limiter does not skew tests. */
let ipCounter = 0;
export const freshIp = () => {
  ipCounter += 1;
  return `198.51.100.${ipCounter % 250}`;
};

export const startDb = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'campusplay-test' });
  await mongoose.connection.syncIndexes();
};

export const stopDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

export const resetDb = async () => {
  await Promise.all([User.deleteMany({}), Booking.deleteMany({})]);
  await Booking.syncIndexes();
};

export const studentPayload = (overrides = {}) => ({
  name: 'Test Student',
  email: 'student1@vit.edu.in',
  password: 'Passw0rdX',
  roll: 'S1001',
  branch: 'INFT',
  division: 'A',
  classYear: 'BE',
  ...overrides,
});

/** Registers a student and returns { user, cookie } */
export const registerStudent = async (overrides = {}) => {
  const payload = studentPayload(overrides);
  const res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', freshIp())
    .send(payload);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${res.text}`);
  return { user: res.body.data.user, cookie: res.headers['set-cookie'], payload };
};

/** Creates an admin directly (as the seed script does) and logs in. */
export const createAdmin = async () => {
  const password = 'Adm1nPassw0rd';
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@campusplay.com',
    password,
    role: 'admin',
    roll: 'ADMIN000',
    branch: 'INFT',
    division: 'A',
    classYear: 'BE',
  });
  const res = await request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', freshIp())
    .send({ email: admin.email, password });
  return { admin, cookie: res.headers['set-cookie'] };
};

export const bookingPayload = (overrides = {}) => ({
  game: 'Cricket',
  ground: 'Main Ground',
  date: '2099-01-01',
  time: '8–9 AM',
  teamMembers: [],
  ...overrides,
});

export { request };
