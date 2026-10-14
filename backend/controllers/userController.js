import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { ERROR_MESSAGES } from '../constants/index.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';
import { validateAcademicData } from '../utils/academicValidator.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user }, 'Profile');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);

    // Immutable fields: email, roll
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }

    // Phone number validation
    if (req.body.phone !== undefined) {
      if (req.body.phone && String(req.body.phone).trim()) {
        const phoneValidation = validateAndNormalizePhone(req.body.phone, { isRequired: true });
        if (!phoneValidation.valid) {
          return sendError(res, phoneValidation.message, 400);
        }
        user.phone = phoneValidation.normalized;
      } else {
        user.phone = undefined;
      }
    }

    // Alternate phone number validation
    if (req.body.alternatePhone !== undefined) {
      if (req.body.alternatePhone && String(req.body.alternatePhone).trim()) {
        const altValidation = validateAndNormalizePhone(req.body.alternatePhone, { isRequired: false, isAlternate: true });
        if (!altValidation.valid) {
          return sendError(res, altValidation.message, 400);
        }
        if (altValidation.normalized === (user.phone || req.body.phone)) {
          return sendError(res, 'Alternate mobile number must be different from primary mobile number.', 400);
        }
        user.alternatePhone = altValidation.normalized;
      } else {
        user.alternatePhone = undefined;
      }
    }

    // Academic fields update
    const hasAcademicUpdates = req.body.branch !== undefined || req.body.classYear !== undefined || req.body.division !== undefined || req.body.semester !== undefined;
    if (hasAcademicUpdates) {
      if (user.academicProfileVerified) {
        return sendError(res, 'Your academic profile is officially verified and cannot be modified directly. Please request a correction via admin.', 403);
      }

      const candBranch = req.body.branch !== undefined ? req.body.branch : user.branch;
      const candYear = req.body.classYear !== undefined ? req.body.classYear : user.classYear;
      const candDiv = req.body.division !== undefined ? req.body.division : user.division;
      const candSem = (req.body.semester !== undefined && req.body.semester !== null && req.body.semester !== '') 
        ? Number(req.body.semester) 
        : (req.body.semester === null || req.body.semester === '' ? undefined : user.semester);

      const acadValidation = validateAcademicData({
        branch: candBranch,
        classYear: candYear,
        division: candDiv,
        semester: candSem,
        roll: user.roll,
      }, { isStrict: false });

      if (!acadValidation.valid) {
        return sendError(res, acadValidation.message, 400);
      }

      if (acadValidation.normalized.branch) user.branch = acadValidation.normalized.branch;
      if (acadValidation.normalized.classYear) user.classYear = acadValidation.normalized.classYear;
      if (acadValidation.normalized.division) user.division = acadValidation.normalized.division;
      if (req.body.semester === null || req.body.semester === '') {
        user.semester = undefined;
      } else if (acadValidation.normalized.semester !== undefined && !isNaN(acadValidation.normalized.semester)) {
        user.semester = acadValidation.normalized.semester;
      }
    }

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    return sendSuccess(res, { user: safe }, 'Profile updated');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return sendError(res, 'Current and new password are required', 400);

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return sendError(res, validation.message, 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);

    const ok = await user.matchPassword(currentPassword);
    if (!ok) return sendError(res, 'Incorrect current password', 400);

    user.password = newPassword;
    await user.save();
    return sendSuccess(res, null, 'Password updated');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};
