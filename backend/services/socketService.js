/**
 * Socket.io Service for Real-time Updates
 *
 * Authentication mirrors the REST API: the JWT is read from the HttpOnly
 * cookie sent with the handshake, verified server-side, and the resulting
 * user record is the only source of identity/role. Clients cannot choose
 * their room.
 */

import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import User from '../models/User.js';
import { USER_ROLES } from '../constants/index.js';

let io = null;

export const ADMIN_ROOM = 'admin-room';
export const studentRoom = (userId) => `student-${userId}`;

export const authenticateSocket = async (socket, next) => {
  try {
    const rawCookie = socket.handshake.headers?.cookie;
    if (!rawCookie) return next(new Error('UNAUTHORIZED'));

    const { token } = cookie.parse(rawCookie);
    if (!token) return next(new Error('UNAUTHORIZED'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('_id role');
    if (!user) return next(new Error('UNAUTHORIZED'));

    socket.data.user = { id: String(user._id), role: user.role };
    return next();
  } catch (err) {
    return next(new Error('UNAUTHORIZED'));
  }
};

export const initializeSocket = (socketIO) => {
  io = socketIO;

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.data.user;

    if (role === USER_ROLES.ADMIN) {
      socket.join(ADMIN_ROOM);
    } else {
      socket.join(studentRoom(userId));
    }

    // Legacy no-op handlers: rooms are assigned from the verified JWT above,
    // so these events can no longer be used to escalate privileges.
    socket.on('join-admin', () => {});
    socket.on('join-student', () => {});
  });
};

export const emitBookingUpdate = (event, data) => {
  if (!io) return;

  // Emit to admin room
  io.to(ADMIN_ROOM).emit(event, data);

  // Emit to specific student if booking has student ID
  if (data.booking?.student?._id || data.booking?.student) {
    const studentId = data.booking.student._id || data.booking.student;
    io.to(studentRoom(studentId)).emit(event, data);
  }
};

export const getIO = () => io;
