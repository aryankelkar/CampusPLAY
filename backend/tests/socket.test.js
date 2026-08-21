import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Server } from 'socket.io';
import { io as createClient } from 'socket.io-client';
import { app, request, startDb, stopDb, resetDb, registerStudent, createAdmin } from './helpers.js';
import { initializeSocket, emitBookingUpdate, ADMIN_ROOM, studentRoom } from '../services/socketService.js';

let httpServer;
let ioServer;
let url;

before(async () => {
  await startDb();
  httpServer = http.createServer(app);
  ioServer = new Server(httpServer, { cors: { origin: '*', credentials: true } });
  initializeSocket(ioServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${httpServer.address().port}`;
});

after(async () => {
  await new Promise((resolve) => ioServer.close(resolve));
  await new Promise((resolve) => httpServer.close(resolve));
  await stopDb();
});

beforeEach(resetDb);

const connect = (cookie) =>
  new Promise((resolve, reject) => {
    const socket = createClient(url, {
      transports: ['websocket'],
      extraHeaders: cookie ? { Cookie: [].concat(cookie).join('; ') } : {},
      reconnection: false,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });

test('an anonymous connection is rejected', async () => {
  await assert.rejects(connect(null), (err) => err.message === 'UNAUTHORIZED');
});

test('an invalid or expired token is rejected', async () => {
  await assert.rejects(connect('token=not-a-jwt'), (err) => err.message === 'UNAUTHORIZED');
});

test('a student is placed in their own room only and cannot join admin-room', async () => {
  const { user, cookie } = await registerStudent();
  const socket = await connect(cookie);
  try {
    // Legacy escalation attempts must be no-ops.
    socket.emit('join-admin');
    socket.emit('join-student', 'someone-else');
    await new Promise((r) => setTimeout(r, 100));

    const serverSocket = ioServer.sockets.sockets.get(socket.id);
    const rooms = [...serverSocket.rooms];
    assert.ok(rooms.includes(studentRoom(user._id)));
    assert.ok(!rooms.includes(ADMIN_ROOM));
    assert.ok(!rooms.includes(studentRoom('someone-else')));
  } finally {
    socket.close();
  }
});

test('a student does not receive another student events', async () => {
  const a = await registerStudent();
  const b = await registerStudent({ email: 'student2@vit.edu.in', roll: 'S1002', name: 'Second' });
  const socketB = await connect(b.cookie);
  try {
    let received = false;
    socketB.on('booking:created', () => {
      received = true;
    });
    emitBookingUpdate('booking:created', { booking: { student: a.user._id } });
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(received, false);
  } finally {
    socketB.close();
  }
});

test('an admin joins admin-room and receives booking events', async () => {
  const { cookie } = await createAdmin();
  const student = await registerStudent();
  const socket = await connect(cookie);
  try {
    const serverSocket = ioServer.sockets.sockets.get(socket.id);
    assert.ok([...serverSocket.rooms].includes(ADMIN_ROOM));

    const received = new Promise((resolve) => socket.on('booking:created', resolve));
    emitBookingUpdate('booking:created', { booking: { student: student.user._id } });
    const payload = await received;
    assert.ok(payload.booking);
  } finally {
    socket.close();
  }
});

test('logging out invalidates nothing server-side but the cookie is cleared', async () => {
  const res = await request(app).post('/api/auth/logout');
  assert.ok(String(res.headers['set-cookie']).includes('token=;'));
});
