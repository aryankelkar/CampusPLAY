import { validationResult } from 'express-validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, roll, branch, division, classYear } = req.body;
  try {
    // Domain validation (allow admin exception)
    if (!email?.endsWith('@vit.edu.in') && email !== 'admin@campusplay.com') {
      return sendError(res, 'Only official college emails ending with @vit.edu.in are allowed.', 400);
    }
    // For student registrations, require academic fields
    if (email !== 'admin@campusplay.com') {
      if (!roll) return sendError(res, 'Roll number is required.', 400);
      if (!branch || !division || !classYear) return sendError(res, 'Branch, Division, and Class Year are required.', 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) return sendError(res, 'User already exists', 400);
    if (roll) {
      const rollExists = await User.findOne({ roll });
      if (rollExists) return sendError(res, 'Roll number already registered', 400);
    }

    const payload = email === 'admin@campusplay.com'
      ? { name, email, password, role: 'student' }
      : { name, email, password, role: 'student', roll, branch, division, classYear };
    const user = await User.create(payload);
    generateToken(res, user._id, user.role);
    return sendSuccess(
      res,
      { user: { _id: user._id, name: user.name, email: user.email, role: user.role, roll: user.roll, branch: user.branch, division: user.division, classYear: user.classYear } },
      'Registered successfully',
      201
    );
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    if (!email?.endsWith('@vit.edu.in') && email !== 'admin@campusplay.com') {
      return sendError(res, '❌ Please use your official college email (@vit.edu.in) to log in.', 400);
    }
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 'Invalid credentials', 401);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return sendError(res, 'Invalid credentials', 401);

    generateToken(res, user._id, user.role);
    return sendSuccess(res, { user: { _id: user._id, name: user.name, email: user.email, role: user.role, roll: user.roll, branch: user.branch, division: user.division, classYear: user.classYear } }, 'Logged in');
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const me = async (req, res) => {
  // req.user is selected without password in protect middleware
  return sendSuccess(res, { user: req.user }, 'Me');
};

export const logout = async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  return sendSuccess(res, null, 'Logged out');
};
