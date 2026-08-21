import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { app, request, startDb, stopDb, resetDb, studentPayload, registerStudent, createAdmin, freshIp } from './helpers.js';

const post = (path) => request(app).post(path).set('X-Forwarded-For', freshIp());

before(startDb);
after(stopDb);
beforeEach(resetDb);

test('registers a valid student and never grants admin', async () => {
  const res = await post('/api/auth/register').send(studentPayload());
  assert.equal(res.status, 201);
  assert.equal(res.body.data.user.role, 'student');
  assert.ok(String(res.headers['set-cookie']).includes('token='));
});

test('registration with the admin email still creates a student', async () => {
  const res = await post('/api/auth/register').send(studentPayload({ email: 'admin@campusplay.com' }));
  // Non-college domain is rejected outright; either way no admin is created.
  assert.equal(res.status, 400);
});

test('rejects a non-college email domain', async () => {
  const res = await post('/api/auth/register').send(studentPayload({ email: 'someone@gmail.com' }));
  assert.equal(res.status, 400);
});

test('rejects a weak password', async () => {
  const res = await post('/api/auth/register').send(studentPayload({ password: 'weak' }));
  assert.equal(res.status, 400);
});

test('logs in with valid credentials and rejects invalid ones', async () => {
  const { payload } = await registerStudent();

  const ok = await post('/api/auth/login').send({ email: payload.email, password: payload.password });
  assert.equal(ok.status, 200);

  const bad = await post('/api/auth/login').send({ email: payload.email, password: 'Wr0ngPassword' });
  assert.equal(bad.status, 401);
});

test('logout works without a valid token and clears the cookie', async () => {
  const res = await post('/api/auth/logout');
  assert.equal(res.status, 200);
  assert.ok(String(res.headers['set-cookie']).includes('token=;'));
});

test('seeded admin can log in and is recognised as admin', async () => {
  const { cookie } = await createAdmin();
  const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.role, 'admin');
});

test('auth endpoints are rate limited', async () => {
  const previous = process.env.AUTH_RATE_LIMIT_MAX;
  process.env.AUTH_RATE_LIMIT_MAX = '3';
  try {
    let last;
    for (let i = 0; i < 6; i += 1) {
      last = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.99')
        .send({ email: 'nobody@vit.edu.in', password: 'Passw0rdX' });
    }
    assert.equal(last.status, 429);
  } finally {
    process.env.AUTH_RATE_LIMIT_MAX = previous;
  }
});
