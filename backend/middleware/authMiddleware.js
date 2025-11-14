import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/responseHandler.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return sendError(res, 'Not authorized, no token', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    if (!req.user) return sendError(res, 'User not found', 401);

    next();
  } catch (err) {
    return sendError(res, 'Not authorized, token failed', 401);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return sendError(res, 'Admin access only', 403);
};
