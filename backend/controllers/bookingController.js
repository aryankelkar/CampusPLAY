import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { BOOKING_STATUS, MAX_TEAM_MEMBERS, TIME_SLOTS, ERROR_MESSAGES } from '../constants/index.js';

export const getBookings = async (req, res) => {
  try {
    const baseFilter = req.user?.role === 'student' ? { student: req.user._id } : {};
    const queryFilter = {};
    if (req.query?.ground) queryFilter.ground = req.query.ground;
    if (req.query?.date) queryFilter.date = req.query.date;
    const filter = { ...baseFilter, ...queryFilter };
    const bookings = await Booking.find(filter)
      .populate('student', 'name email roll branch division classYear')
      .sort({ createdAt: -1 });
    return sendSuccess(res, { bookings }, 'Bookings fetched');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    if (req.user?.role !== 'student') return sendError(res, 'Only students can cancel their bookings', 403);
    if (String(booking.student) !== String(req.user._id)) return sendError(res, 'Not authorized to cancel this booking', 403);
    if (booking.status !== BOOKING_STATUS.PENDING) return sendError(res, 'Only pending bookings can be canceled', 400);
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.canceledAt = new Date();
    await booking.save();
    return sendSuccess(res, { booking }, 'Booking canceled');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    // Conflict check: prevent duplicate time slot for same date + ground
    const { ground, date, time } = req.body;
    const existing = await Booking.findOne({ ground, date, time });
    if (existing) {
      return sendError(res, ERROR_MESSAGES.SLOT_BOOKED, 409);
    }

    // Validate team members if provided
    const teamMembers = Array.isArray(req.body.teamMembers) ? req.body.teamMembers : [];
    if (teamMembers.length > MAX_TEAM_MEMBERS) {
      return sendError(res, `You can add up to ${MAX_TEAM_MEMBERS} players per booking.`, 400);
    }
    const seenRolls = new Set();
    const seenEmails = new Set();
    for (const m of teamMembers) {
      if (!m?.name || !m?.roll || !m?.email) {
        return sendError(res, 'All team members must have name, roll and email.', 400);
      }
      if (!m.email.endsWith('@vit.edu.in')) {
        return sendError(res, 'Invalid teammate email domain.', 400);
      }
      // duplicates in team
      if (seenRolls.has(m.roll) || seenEmails.has(m.email)) {
        return sendError(res, 'Duplicate teammate roll or email detected.', 400);
      }
      seenRolls.add(m.roll);
      seenEmails.add(m.email);
      // prevent same as main student
      if (req.user?.roll && m.roll === req.user.roll) {
        return sendError(res, 'Teammate roll cannot be the same as the booking student.', 400);
      }
      if (req.user?.email && m.email === req.user.email) {
        return sendError(res, 'Teammate email cannot be the same as the booking student.', 400);
      }
    }

    // Snapshot some user fields on the booking
    const snapshot = {
      name: req.user?.name,
      email: req.user?.email,
      roll: req.user?.roll,
      branch: req.user?.branch,
      division: req.user?.division,
      classYear: req.user?.classYear,
    };

    // Enforce server-side snapshot fields; do not allow client to override identity fields
    const booking = await Booking.create({ ...req.body, ...snapshot, teamMembers, student: req.user._id, status: BOOKING_STATUS.PENDING });
    return sendSuccess(res, { booking }, 'Booking created', 201);
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    // Check for conflicts before approving
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      ground: booking.ground,
      date: booking.date,
      time: booking.time,
      status: BOOKING_STATUS.APPROVED
    });
    
    if (conflict) {
      return sendError(res, 'This slot is already approved for another booking. Please reject or revoke the conflicting booking first.', 409);
    }
    
    // Update booking with approval details
    booking.status = BOOKING_STATUS.APPROVED;
    booking.approvedBy = req.user?.email || req.user?.name || 'admin';
    booking.approvedAt = new Date();
    
    // Clear rejection fields when approving
    booking.rejectionReason = '';
    booking.rejectedBy = undefined;
    booking.rejectedAt = undefined;
    
    await booking.save();
    
    // Populate student info for response
    await booking.populate('student', 'name email roll branch division classYear');
    
    return sendSuccess(res, { booking }, 'Booking approved');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    const reason = req.body?.reason || '';
    
    // Update booking with rejection details
    // Clear approval fields if this was previously approved
    booking.status = BOOKING_STATUS.REJECTED;
    booking.rejectionReason = reason;
    booking.rejectedBy = req.user?.email || req.user?.name || 'admin';
    booking.rejectedAt = new Date();
    
    // Clear approval fields when rejecting (important for post-approval rejection)
    if (booking.approvedAt) {
      booking.approvedBy = undefined;
      booking.approvedAt = undefined;
    }
    
    await booking.save();
    
    // Populate student info for response
    await booking.populate('student', 'name email roll branch division classYear');
    
    return sendSuccess(res, { booking }, 'Booking rejected');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const setPending = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    const previousStatus = booking.status;
    
    // Move to pending and clear status-specific fields
    booking.status = BOOKING_STATUS.PENDING;
    
    // Note: We keep approval/rejection history for audit trail
    // but the status change indicates it's been revoked
    
    await booking.save();
    
    // Populate student info for response
    await booking.populate('student', 'name email roll branch division classYear');
    
    const message = previousStatus === BOOKING_STATUS.APPROVED 
      ? 'Booking approval revoked - moved to pending'
      : previousStatus === BOOKING_STATUS.REJECTED
        ? 'Booking rejection revoked - moved to pending'
        : 'Booking moved to pending';
    
    return sendSuccess(res, { booking }, message);
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const availability = async (req, res) => {
  try {
    const { date, ground } = req.query;
    if (!date || !ground) return sendError(res, 'date and ground are required', 400);
    // Only show Approved bookings as 'Booked'. Pending bookings don't block slots.
    const bookings = await Booking.find({ date, ground, status: BOOKING_STATUS.APPROVED });
    const bookedTimes = bookings.map((b) => b.time);

    const allSlots = TIME_SLOTS;

    const slots = allSlots.map((slot) => {
      const match = bookings.find((b) => b.time === slot);
      return {
        slot,
        status: match ? 'Booked' : 'Vacant',
        bookedBy: match ? (match.name || (match.student && match.student.name) || null) : null,
        game: match ? match.game : null,
      };
    });

    return res.status(200).json({ success: true, message: 'Availability', data: { slots, bookedTimes }, bookedTimes });
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};
