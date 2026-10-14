import { validationResult } from 'express-validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { ADMIN_EMAIL, USER_ROLES, ERROR_MESSAGES } from '../constants/index.js';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, roll, branch, division, classYear, semester, phone } = req.body;
  try {
    // Domain validation (allow admin exception)
    if (!email?.endsWith('@vit.edu.in') && email !== ADMIN_EMAIL) {
      return sendError(res, ERROR_MESSAGES.INVALID_EMAIL_DOMAIN, 400);
    }
    // For student registrations, require academic fields
    if (email !== ADMIN_EMAIL) {
      if (!roll) return sendError(res, 'Roll number is required.', 400);
      if (!branch || !division || !classYear) return sendError(res, 'Branch, Division, and Class Year are required.', 400);
    }

    let parsedSemester = undefined;
    if (semester !== undefined && semester !== null && semester !== '') {
      parsedSemester = Number(semester);
      if (isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
        return sendError(res, 'Semester must be a number between 1 and 8.', 400);
      }
    }

    let normalizedPhone = undefined;
    if (phone && String(phone).trim() !== '') {
      const phoneValidation = validateAndNormalizePhone(phone, { isRequired: false });
      if (!phoneValidation.valid) {
        return sendError(res, phoneValidation.message || 'Invalid phone number.', 400);
      }
      normalizedPhone = phoneValidation.normalized;
    }

    const userExists = await User.findOne({ email });
    if (userExists) return sendError(res, ERROR_MESSAGES.USER_EXISTS, 400);
    if (roll) {
      const rollExists = await User.findOne({ roll });
      if (rollExists) return sendError(res, ERROR_MESSAGES.ROLL_EXISTS, 400);
    }

    const payload = email === ADMIN_EMAIL
      ? { 
          name, 
          email, 
          password, 
          role: USER_ROLES.ADMIN,
          ...(normalizedPhone ? { phone: normalizedPhone } : {})
        }
      : { 
          name, 
          email, 
          password, 
          role: USER_ROLES.STUDENT, 
          roll, 
          branch, 
          division, 
          classYear,
          ...(parsedSemester ? { semester: parsedSemester } : {}),
          ...(normalizedPhone ? { phone: normalizedPhone } : {})
        };
    const user = await User.create(payload);
    const token = generateToken(res, user._id, user.role);
    return sendSuccess(
      res,
      { 
        token, 
        user: { 
          _id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          roll: user.roll, 
          branch: user.branch, 
          division: user.division, 
          classYear: user.classYear,
          semester: user.semester,
          phone: user.phone,
          academicProfileVerified: user.academicProfileVerified,
        } 
      },
      'Registered successfully',
      201
    );
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const login = async (req, res) => {
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

    const token = generateToken(res, user._id, user.role);
    return sendSuccess(
      res, 
      { 
        token, 
        user: { 
          _id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          roll: user.roll, 
          branch: user.branch, 
          division: user.division, 
          classYear: user.classYear,
          semester: user.semester,
          phone: user.phone,
          alternatePhone: user.alternatePhone,
          academicProfileVerified: user.academicProfileVerified,
        } 
      }, 
      'Logged in'
    );
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const me = async (req, res) => {
  // req.user is selected without password in protect middleware
  return sendSuccess(res, { user: req.user }, 'Me');
};

export const logout = async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  res.clearCookie('token', cookieOptions);
  res.cookie('token', '', { ...cookieOptions, expires: new Date(0), maxAge: 0 });
  return sendSuccess(res, null, 'Logged out');
};
