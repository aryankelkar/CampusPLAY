import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user }, 'Profile');
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);

    // Immutable fields: email, roll
    if (typeof req.body.name === 'string') user.name = req.body.name;
    if (typeof req.body.branch === 'string') user.branch = req.body.branch;
    if (typeof req.body.division === 'string') user.division = req.body.division;
    if (typeof req.body.classYear === 'string') user.classYear = req.body.classYear;

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    return sendSuccess(res, { user: safe }, 'Profile updated');
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return sendError(res, 'Current and new password are required', 400);

    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);

    const ok = await user.matchPassword(currentPassword);
    if (!ok) return sendError(res, 'Incorrect current password', 400);

    user.password = newPassword;
    await user.save();
    return sendSuccess(res, null, 'Password updated');
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};
