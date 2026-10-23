import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { BOOKING_STATUS, MAX_TEAM_MEMBERS, TIME_SLOTS, ERROR_MESSAGES } from '../constants/index.js';
import * as bookingService from '../services/bookingService.js';
import { emitBookingUpdate } from '../services/socketService.js';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';
import { validateAcademicData } from '../utils/academicValidator.js';

export const getBookings = async (req, res) => {
  try {
    const baseFilter = req.user?.role === 'student' ? { student: req.user._id } : {};
    const queryFilter = {};
    if (req.query?.ground || req.query?.facility) {
      const facName = req.query.facility || req.query.ground;
      queryFilter.$or = [{ facility: facName }, { ground: facName }];
    }
    if (req.query?.date) queryFilter.date = req.query.date;
    const filter = { ...baseFilter, ...queryFilter };
    const bookings = await Booking.find(filter)
      .populate('student', 'name email roll branch division classYear semester phone alternatePhone academicVerificationStatus academicProfileVerified')
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, { bookings }, 'Bookings fetched');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingService.findBookingById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    if (req.user?.role !== 'student') return sendError(res, 'Only students can cancel their bookings', 403);
    if (String(booking.student._id) !== String(req.user._id)) return sendError(res, 'Not authorized to cancel this booking', 403);
    
    if (booking.status !== BOOKING_STATUS.PENDING && booking.status !== BOOKING_STATUS.APPROVED) {
      return sendError(res, 'Only pending or approved bookings can be cancelled', 400);
    }
    
    const updatedBooking = await bookingService.updateBookingStatus(
      req.params.id,
      BOOKING_STATUS.CANCELLED,
      { canceledBy: req.user.name || req.user.email }
    );
    
    emitBookingUpdate('booking:cancelled', { booking: updatedBooking });
    return sendSuccess(res, { booking: updatedBooking }, 'Booking cancelled successfully. Slot is now available again.');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await bookingService.findBookingById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    if (req.user?.role === 'student') {
      if (String(booking.student._id) !== String(req.user._id)) {
        return sendError(res, 'Not authorized to delete this booking', 403);
      }
      if (booking.status !== BOOKING_STATUS.REJECTED && booking.status !== BOOKING_STATUS.CANCELLED) {
        return sendError(res, 'You can only delete rejected or cancelled bookings', 400);
      }
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    emitBookingUpdate('booking:deleted', { booking });
    return sendSuccess(res, { booking }, 'Booking deleted successfully.');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { ground, facility, game, sport, date, time, timeSlots } = req.body;
    const targetFacility = facility || ground;
    const targetSport = sport || game;
    const slotsToBook = timeSlots || (time ? [time] : []);
    
    if (!slotsToBook || slotsToBook.length === 0) {
      return sendError(res, 'At least one time slot is required', 400);
    }
    
    if (slotsToBook.length > 2) {
      return sendError(res, 'Maximum 2 time slots allowed per booking', 400);
    }

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
      if (seenRolls.has(m.roll) || seenEmails.has(m.email)) {
        return sendError(res, 'Duplicate teammate roll or email detected.', 400);
      }
      seenRolls.add(m.roll);
      seenEmails.add(m.email);
      if (req.user?.roll && m.roll === req.user.roll) {
        return sendError(res, 'Teammate roll cannot be the same as the booking student.', 400);
      }
      if (req.user?.email && m.email === req.user.email) {
        return sendError(res, 'Teammate email cannot be the same as the booking student.', 400);
      }
    }

    // 1. Contact Details Validation (Phone & Optional Alternate Phone)
    const phoneInput = req.body.phone || req.user?.phone;
    const phoneValidation = validateAndNormalizePhone(phoneInput, { isRequired: true });
    if (!phoneValidation.valid) {
      return sendError(res, phoneValidation.message, 400);
    }
    const normalizedPhone = phoneValidation.normalized;

    let normalizedAltPhone = '';
    const altPhoneInput = req.body.alternatePhone || req.user?.alternatePhone;
    if (altPhoneInput && String(altPhoneInput).trim()) {
      const altValidation = validateAndNormalizePhone(altPhoneInput, { isRequired: false, isAlternate: true });
      if (!altValidation.valid) {
        return sendError(res, altValidation.message, 400);
      }
      if (altValidation.normalized === normalizedPhone) {
        return sendError(res, 'Alternate mobile number must be different from primary mobile number.', 400);
      }
      normalizedAltPhone = altValidation.normalized;
    }

    // 2. Academic Details Validation & Verified Profile Protection
    let finalAcademic = {};
    let academicVerificationStatus = req.user?.academicVerificationStatus || (req.user?.academicProfileVerified ? 'VERIFIED' : 'UNVERIFIED');

    if (req.user?.academicProfileVerified === true) {
      // Profile is verified: use verified values directly (prevent silent overwrite or client spoofing)
      finalAcademic = {
        roll: req.user.roll,
        branch: req.user.branch,
        division: req.user.division,
        classYear: req.user.classYear,
        semester: req.user.semester,
      };
      academicVerificationStatus = 'VERIFIED';
    } else {
      // Profile is unverified: take student-provided values with profile fallback
      const candBranch = req.body.branch || req.user?.branch;
      const candYear = req.body.classYear || req.body.academicYear || req.user?.classYear;
      const candDiv = req.body.division || req.user?.division;
      const candSem = req.body.semester !== undefined && req.body.semester !== null && req.body.semester !== ''
        ? req.body.semester
        : req.user?.semester;
      const candRoll = req.user?.roll || req.body.roll;

      const acadValidation = validateAcademicData({
        branch: candBranch,
        classYear: candYear,
        division: candDiv,
        semester: candSem,
        roll: candRoll,
      }, { isStrict: true });

      if (!acadValidation.valid) {
        return sendError(res, acadValidation.message, 400);
      }

      finalAcademic = acadValidation.normalized;

      // Update student profile with provided details if profile was missing them
      let profileUpdated = false;
      if (!req.user?.phone && normalizedPhone) {
        req.user.phone = normalizedPhone;
        profileUpdated = true;
      }
      if (!req.user?.alternatePhone && normalizedAltPhone) {
        req.user.alternatePhone = normalizedAltPhone;
        profileUpdated = true;
      }
      if (!req.user?.branch && finalAcademic.branch) {
        req.user.branch = finalAcademic.branch;
        profileUpdated = true;
      }
      if (!req.user?.classYear && finalAcademic.classYear) {
        req.user.classYear = finalAcademic.classYear;
        profileUpdated = true;
      }
      if (!req.user?.division && finalAcademic.division) {
        req.user.division = finalAcademic.division;
        profileUpdated = true;
      }
      if (req.user?.semester === undefined && finalAcademic.semester) {
        req.user.semester = finalAcademic.semester;
        profileUpdated = true;
      }

      if (profileUpdated && typeof req.user?.save === 'function') {
        try {
          await req.user.save();
        } catch (e) {
          console.warn('Could not auto-update user profile with booking details:', e.message);
        }
      }
    }

    const snapshot = {
      name: req.user?.name || '',
      email: req.user?.email || '',
      phone: normalizedPhone,
      alternatePhone: normalizedAltPhone || undefined,
      roll: finalAcademic.roll || req.user?.roll || '',
      branch: finalAcademic.branch || '',
      division: finalAcademic.division || '',
      classYear: finalAcademic.classYear || '',
      semester: finalAcademic.semester || undefined,
      academicVerificationStatus,
    };

    const bookingData = { 
      ...req.body, 
      game: targetSport,
      ground: targetFacility,
      facility: targetFacility,
      timeSlots: slotsToBook,
      teamMembers, 
    };
    delete bookingData.time;
    
    const booking = await bookingService.createBookingWithValidation(bookingData, req.user._id, snapshot);
    
    emitBookingUpdate('booking:created', { booking });
    return sendSuccess(res, { booking }, 'Booking created successfully (Pending Approval)', 201);
  } catch (err) {
    console.error('❌ Error creating booking:', err.message);
    const statusCode = err.statusCode || 400;
    return sendError(res, err.message || ERROR_MESSAGES.SERVER_ERROR, statusCode);
  }
};

export const approveBooking = async (req, res) => {
  try {
    const booking = await bookingService.findBookingById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    const updatedBooking = await bookingService.updateBookingStatus(
      req.params.id,
      BOOKING_STATUS.APPROVED,
      { approvedBy: req.user?.email || req.user?.name || 'admin' }
    );
    
    emitBookingUpdate('booking:approved', { booking: updatedBooking });
    return sendSuccess(res, { booking: updatedBooking }, 'Booking approved successfully.');
  } catch (err) {
    console.error('❌ Approval conflict / error:', err.message);
    return sendError(res, err.message || 'Approval conflict. This facility is already booked for the selected time.', 409);
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const booking = await bookingService.findBookingById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    const reason = req.body?.reason || '';
    
    const updatedBooking = await bookingService.updateBookingStatus(
      req.params.id,
      BOOKING_STATUS.REJECTED,
      { 
        reason,
        rejectedBy: req.user?.email || req.user?.name || 'admin'
      }
    );
    
    emitBookingUpdate('booking:rejected', { booking: updatedBooking });
    return sendSuccess(res, { booking: updatedBooking }, 'Booking rejected');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const setPending = async (req, res) => {
  try {
    const booking = await bookingService.findBookingById(req.params.id);
    if (!booking) return sendError(res, 'Booking not found', 404);
    
    const previousStatus = booking.status;
    const updatedBooking = await bookingService.updateBookingStatus(
      req.params.id,
      BOOKING_STATUS.PENDING,
      {}
    );
    
    const message = previousStatus === BOOKING_STATUS.APPROVED 
      ? 'Booking approval revoked - moved to pending'
      : previousStatus === BOOKING_STATUS.REJECTED
        ? 'Booking rejection revoked - moved to pending'
        : 'Booking moved to pending';
    
    emitBookingUpdate('booking:revoked', { booking: updatedBooking, previousStatus });
    return sendSuccess(res, { booking: updatedBooking }, message);
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

export const availability = async (req, res) => {
  try {
    const { date, ground, facility } = req.query;
    const targetFacility = facility || ground;
    if (!date || !targetFacility) return sendError(res, 'date and facility are required', 400);
    
    const { slots, bookedTimes } = await bookingService.getAvailableSlots(date, targetFacility, TIME_SLOTS);
    return res.status(200).json({ success: true, message: 'Availability', data: { slots, bookedTimes }, bookedTimes });
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};
