import { validationResult } from 'express-validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { ADMIN_EMAIL, USER_ROLES, ERROR_MESSAGES } from '../constants/index.js';

export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, roll, branch, division, classYear } = req.body;
  try {
    if (!email?.endsWith('@vit.edu.in')) {
      return sendError(res, ERROR_MESSAGES.INVALID_EMAIL_DOMAIN, 400);
    }
    if (!roll) return sendError(res, 'Roll number is required.', 400);
    if (!branch || !division || !classYear) return sendError(res, 'Branch, Division, and Class Year are required.', 400);

    const userExists = await User.findOne({ email });
    if (userExists) return sendError(res, ERROR_MESSAGES.USER_EXISTS, 400);
    const rollExists = await User.findOne({ roll });
    if (rollExists) return sendError(res, ERROR_MESSAGES.ROLL_EXISTS, 400);

    // Public registration always creates a student. Admins are provisioned
    // out-of-band through the seed script.
    const user = await User.create({ name, email, password, role: USER_ROLES.STUDENT, roll, branch, division, classYear });
    generateToken(res, user._id, user.role);
    return sendSuccess(
      res,
      { user: { _id: user._id, name: user.name, email: user.email, role: user.role, roll: user.roll, branch: user.branch, division: user.division, classYear: user.classYear } },
      'Registered successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
};

export const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    if (!email?.endsWith('@vit.edu.in') && email !== ADMIN_EMAIL) {
      return sendError(res, '❌ Please use your official college email (@vit.edu.in) to log in.', 400);
    }
    const user = await User.findOne({ email });
    if (!user) return sendError(res, ERROR_MESSAGES.INVALID_CREDENTIALS, 401);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return sendError(res, ERROR_MESSAGES.INVALID_CREDENTIALS, 401);

    generateToken(res, user._id, user.role);
    return sendSuccess(res, { user: { _id: user._id, name: user.name, email: user.email, role: user.role, roll: user.roll, branch: user.branch, division: user.division, classYear: user.classYear } }, 'Logged in');
  } catch (err) {
    return next(err);
  }
};

export const me = async (req, res) => {
  // req.user is selected without password in protect middleware
  return sendSuccess(res, { user: req.user }, 'Me');
};

// Public on purpose: clearing the cookie must work even with an expired token.
export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
  });
  return sendSuccess(res, null, 'Logged out');
};
