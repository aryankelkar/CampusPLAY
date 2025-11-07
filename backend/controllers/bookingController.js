import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

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
    return sendError(res, 'Server error', 500);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    if (req.user?.role !== 'student') return sendError(res, 'Only students can cancel their bookings', 403);
    if (String(booking.student) !== String(req.user._id)) return sendError(res, 'Not authorized to cancel this booking', 403);
    if (booking.status !== 'Pending') return sendError(res, 'Only pending bookings can be canceled', 400);
    booking.status = 'Cancelled';
    booking.canceledAt = new Date();
    await booking.save();
    return sendSuccess(res, { booking }, 'Booking canceled');
  } catch (err) {
    return sendError(res, 'Server error', 500);
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
      return sendError(res, '❌ This slot is already booked. Please choose another time.', 409);
    }

    // Validate team members if provided
    const teamMembers = Array.isArray(req.body.teamMembers) ? req.body.teamMembers : [];
    if (teamMembers.length > 10) {
      return res.status(400).json({ message: 'You can add up to 10 players per booking.' });
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
    const booking = await Booking.create({ ...req.body, ...snapshot, teamMembers, student: req.user._id, status: 'Pending' });
    return sendSuccess(res, { booking }, 'Booking created', 201);
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Approved',
        approvedBy: req.user?.email || req.user?.name || 'admin',
        approvedAt: new Date(),
        // clear rejection fields on approve
        rejectionReason: '',
        rejectedBy: undefined,
        rejectedAt: undefined,
      },
      { new: true }
    );
    if (!booking) return sendError(res, 'Booking not found', 404);
    return sendSuccess(res, { booking }, 'Booking approved');
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const reason = req.body?.reason || '';
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Rejected',
        rejectionReason: reason,
        rejectedBy: req.user?.email || req.user?.name || 'admin',
        rejectedAt: new Date(),
      },
      { new: true }
    );
    if (!booking) return sendError(res, 'Booking not found', 404);
    return sendSuccess(res, { booking }, 'Booking rejected');
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const setPending = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Pending' },
      { new: true }
    );
    if (!booking) return sendError(res, 'Booking not found', 404);
    return sendSuccess(res, { booking }, 'Booking moved to pending');
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};

export const availability = async (req, res) => {
  try {
    const { date, ground } = req.query;
    if (!date || !ground) return sendError(res, 'date and ground are required', 400);
    // Only Pending or Approved block availability
    const bookings = await Booking.find({ date, ground, status: { $in: ['Pending','Approved'] } });
    const bookedTimes = bookings.map((b) => b.time);

    const allSlots = [
      '8–9 AM',
      '9–10 AM',
      '10–11 AM',
      '11–12 AM',
      '12–1 PM',
      '1–2 PM',
      '2–3 PM',
      '3–4 PM',
      '4–5 PM',
      '5–6 PM',
      '6–7 PM',
    ];

    const slots = allSlots.map((slot) => {
      const match = bookings.find((b) => b.time === slot);
      return {
        slot,
        status: match ? (match.status === 'Pending' ? 'Pending' : 'Booked') : 'Vacant',
        bookedBy: match ? (match.name || (match.student && match.student.name) || null) : null,
        game: match ? match.game : null,
      };
    });

    return res.status(200).json({ success: true, message: 'Availability', data: { slots, bookedTimes }, bookedTimes });
  } catch (err) {
    return sendError(res, 'Server error', 500);
  }
};
