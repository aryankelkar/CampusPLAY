import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Booking from '../models/Booking.js';
import {
  app,
  request,
  startDb,
  stopDb,
  resetDb,
  registerStudent,
  createAdmin,
  bookingPayload,
} from './helpers.js';

before(startDb);
after(stopDb);
beforeEach(resetDb);

const otherStudent = () => ({
  email: 'student2@vit.edu.in',
  roll: 'S1002',
  name: 'Second Student',
});

test('creates a valid booking in Pending state', async () => {
  const { cookie } = await registerStudent();
  const res = await request(app).post('/api/bookings').set('Cookie', cookie).send(bookingPayload());
  assert.equal(res.status, 201);
  assert.equal(res.body.data.booking.status, 'Pending');
});

test('a Pending booking blocks the same slot for another student', async () => {
  const a = await registerStudent();
  const b = await registerStudent(otherStudent());
  await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());

  const res = await request(app).post('/api/bookings').set('Cookie', b.cookie).send(bookingPayload());
  assert.equal(res.status, 409);
});

test('an Approved booking blocks the same slot', async () => {
  const a = await registerStudent();
  const b = await registerStudent(otherStudent());
  const { admin: _admin, cookie: adminCookie } = await createAdmin();

  const created = await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());
  await request(app).patch(`/api/bookings/${created.body.data.booking._id}/approve`).set('Cookie', adminCookie);

  const res = await request(app).post('/api/bookings').set('Cookie', b.cookie).send(bookingPayload());
  assert.equal(res.status, 409);
});

test('a Rejected booking frees the slot', async () => {
  const a = await registerStudent();
  const b = await registerStudent(otherStudent());
  const { cookie: adminCookie } = await createAdmin();

  const created = await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());
  await request(app)
    .patch(`/api/bookings/${created.body.data.booking._id}/reject`)
    .set('Cookie', adminCookie)
    .send({ reason: 'ground maintenance' });

  const res = await request(app).post('/api/bookings').set('Cookie', b.cookie).send(bookingPayload());
  assert.equal(res.status, 201);
});

test('a Cancelled booking frees the slot and records who cancelled it', async () => {
  const a = await registerStudent();
  const b = await registerStudent(otherStudent());

  const created = await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());
  const cancelled = await request(app)
    .patch(`/api/bookings/${created.body.data.booking._id}/cancel`)
    .set('Cookie', a.cookie);
  assert.equal(cancelled.status, 200);

  const stored = await Booking.findById(created.body.data.booking._id);
  assert.equal(stored.status, 'Cancelled');
  assert.equal(String(stored.canceledBy), String(a.user._id));
  assert.ok(stored.canceledAt instanceof Date);

  const res = await request(app).post('/api/bookings').set('Cookie', b.cookie).send(bookingPayload());
  assert.equal(res.status, 201);
});

test('the unique index rejects a second active booking for the same slot', async () => {
  const a = await registerStudent();
  const b = await registerStudent(otherStudent());
  const created = await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());

  // Bypass the service-level check to emulate two simultaneous inserts.
  await assert.rejects(
    Booking.create({
      ...bookingPayload(),
      student: b.user._id,
      status: 'Pending',
    }),
    (err) => err.code === 11000
  );
  assert.equal(created.status, 201);
});

test('a student from Division D can book', async () => {
  const { cookie } = await registerStudent({ division: 'D' });
  const res = await request(app).post('/api/bookings').set('Cookie', cookie).send(bookingPayload());
  assert.equal(res.status, 201);
  assert.equal(res.body.data.booking.division, 'D');
});

test('availability marks Pending and Approved slots as Booked', async () => {
  const { cookie } = await registerStudent();
  const payload = bookingPayload();
  await request(app).post('/api/bookings').set('Cookie', cookie).send(payload);

  const res = await request(app)
    .get('/api/bookings/availability')
    .query({ date: payload.date, ground: payload.ground })
    .set('Cookie', cookie);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.bookedTimes, [payload.time]);
  const slot = res.body.data.slots.find((s) => s.slot === payload.time);
  assert.equal(slot.status, 'Booked');
});

test('a student cannot cancel another student booking', async () => {
  const a = await registerStudent();
  const b = await registerStudent(otherStudent());
  const created = await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());

  const res = await request(app)
    .patch(`/api/bookings/${created.body.data.booking._id}/cancel`)
    .set('Cookie', b.cookie);
  assert.equal(res.status, 403);
});
