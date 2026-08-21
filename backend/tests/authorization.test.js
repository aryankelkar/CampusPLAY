import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
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

test('unauthenticated requests to protected APIs are rejected', async () => {
  for (const path of ['/api/bookings', '/api/user/profile', '/api/auth/me']) {
    const res = await request(app).get(path);
    assert.equal(res.status, 401, `${path} should require auth`);
  }
});

test('a student cannot use admin-only booking endpoints', async () => {
  const { cookie } = await registerStudent();
  const created = await request(app).post('/api/bookings').set('Cookie', cookie).send(bookingPayload());
  const id = created.body.data.booking._id;

  for (const path of [`/api/bookings/${id}/approve`, `/api/bookings/${id}/reject`, `/api/bookings/${id}/pending`]) {
    const res = await request(app).patch(path).set('Cookie', cookie);
    assert.equal(res.status, 403, `${path} should be admin only`);
  }
});

test('a student only sees their own bookings', async () => {
  const a = await registerStudent();
  const b = await registerStudent({ email: 'student2@vit.edu.in', roll: 'S1002', name: 'Second' });
  await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());
  await request(app)
    .post('/api/bookings')
    .set('Cookie', b.cookie)
    .send(bookingPayload({ time: '9–10 AM' }));

  const res = await request(app).get('/api/bookings').set('Cookie', a.cookie);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.bookings.length, 1);
  assert.equal(String(res.body.data.bookings[0].student._id), String(a.user._id));
});

test('an admin sees every booking', async () => {
  const a = await registerStudent();
  await request(app).post('/api/bookings').set('Cookie', a.cookie).send(bookingPayload());
  const { cookie: adminCookie } = await createAdmin();

  const res = await request(app).get('/api/bookings').set('Cookie', adminCookie);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.bookings.length, 1);
});

test('an invalid token is rejected rather than treated as anonymous admin', async () => {
  const res = await request(app).get('/api/bookings').set('Cookie', ['token=not-a-jwt']);
  assert.equal(res.status, 401);
});
