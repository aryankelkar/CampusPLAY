import Booking from '../models/Booking.js';
import Facility from '../models/Facility.js';
import { BOOKING_STATUS } from '../constants/index.js';
import { validateSportFacilityMatch } from './facilityService.js';

/**
 * Booking Service Layer
 * Consolidates business logic for facility booking operations
 */

export const findBookingById = async (id) => {
  return await Booking.findById(id).populate('student', 'name email roll branch division classYear');
};

export const getBookingsByFilter = async (filter, sort = { createdAt: -1 }) => {
  return await Booking.find(filter)
    .populate('student', 'name email roll branch division classYear')
    .sort(sort);
};

export const createBookingWithValidation = async (bookingData, userId, userSnapshot) => {
  const sport = bookingData.game || bookingData.sport;
  const facilityName = bookingData.facility || bookingData.ground;

  if (!sport || !facilityName) {
    const err = new Error('Sport and Facility are required.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Validate Date (Prevent booking past dates)
  if (!bookingData.date) {
    const err = new Error('Booking date is required.');
    err.statusCode = 400;
    throw err;
  }
  const todayStr = new Date().toISOString().split('T')[0];
  if (bookingData.date < todayStr) {
    const err = new Error('Cannot reserve a slot for a past date.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Validate Sport-Facility Mapping
  const matchResult = validateSportFacilityMatch(sport, facilityName);
  if (!matchResult.valid) {
    const err = new Error(matchResult.message);
    err.statusCode = 400;
    throw err;
  }

  // 3. Check Facility Active Status
  let facilityRecord = null;
  if (Object.prototype.hasOwnProperty.call(Facility, 'findOne') || Facility.db?.readyState === 1) {
    facilityRecord = await Facility.findOne({ name: facilityName });
  }
  if (facilityRecord && facilityRecord.status !== 'ACTIVE') {
    const err = new Error(`Facility '${facilityName}' is currently under maintenance or temporarily unavailable.`);
    err.statusCode = 400;
    throw err;
  }

  const requestedSlots = bookingData.timeSlots || (bookingData.time ? [bookingData.time] : []);
  if (!requestedSlots || requestedSlots.length === 0) {
    const err = new Error('At least one time slot is required.');
    err.statusCode = 400;
    throw err;
  }

  // 4. Overlap & Concurrency Safeguard: Check if slot is already Approved
  if (Object.prototype.hasOwnProperty.call(Booking, 'findOne') || Booking.db?.readyState === 1) {
    const existingApproved = await Booking.findOne({
      $or: [{ facility: facilityName }, { ground: facilityName }],
      date: bookingData.date,
      timeSlots: { $in: requestedSlots },
      status: BOOKING_STATUS.APPROVED,
    });

    if (existingApproved) {
      const conflictErr = new Error('The requested slot is already confirmed for another booking. Please choose another time.');
      conflictErr.statusCode = 409;
      throw conflictErr;
    }

    // 5. Duplicate Submission Safeguard: Check if this user already submitted an active request for this slot
    const duplicateActive = await Booking.findOne({
      student: userId,
      $or: [{ facility: facilityName }, { ground: facilityName }],
      date: bookingData.date,
      timeSlots: { $in: requestedSlots },
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
    });

    if (duplicateActive) {
      const dupErr = new Error(`You already have an active ${duplicateActive.status.toLowerCase()} reservation for this slot.`);
      dupErr.statusCode = 409;
      throw dupErr;
    }
  }

  // 6. Create Pending Booking
  const booking = await Booking.create({
    ...bookingData,
    ...userSnapshot,
    game: sport,
    ground: facilityName,
    facility: facilityName,
    facilityId: facilityRecord?._id,
    student: userId,
    status: BOOKING_STATUS.PENDING,
  });

  return booking;
};

export const updateBookingStatus = async (bookingId, status, metadata = {}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  const targetFacility = booking.facility || booking.ground;

  // Perform Fresh Conflict Check BEFORE Approval (Requirement 12)
  if (status === BOOKING_STATUS.APPROVED) {
    if (Object.prototype.hasOwnProperty.call(Booking, 'findOne') || Booking.db?.readyState === 1) {
      const existingApprovedConflict = await Booking.findOne({
        _id: { $ne: booking._id },
        $or: [{ facility: targetFacility }, { ground: targetFacility }],
        date: booking.date,
        timeSlots: { $in: booking.timeSlots },
        status: 'Approved',
      });

      if (existingApprovedConflict) {
        const conflictErr = new Error('Approval conflict. This facility is already booked for the selected time.');
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
    }
  }

  booking.status = status;

  // Apply audit metadata
  switch (status) {
    case BOOKING_STATUS.APPROVED:
      booking.approvedBy = metadata.approvedBy;
      booking.approvedAt = new Date();
      booking.rejectionReason = '';
      booking.rejectedBy = undefined;
      booking.rejectedAt = undefined;
      break;

    case BOOKING_STATUS.REJECTED:
      booking.rejectionReason = metadata.reason || '';
      booking.rejectedBy = metadata.rejectedBy;
      booking.rejectedAt = new Date();
      if (booking.approvedAt) {
        booking.approvedBy = undefined;
        booking.approvedAt = undefined;
      }
      break;

    case BOOKING_STATUS.CANCELLED:
      booking.canceledAt = new Date();
      break;

    case BOOKING_STATUS.PENDING:
      break;
  }

  await booking.save();

  // Post-Save Concurrency Safeguard: Detect simultaneous competing approval and rollback if collision occurred
  if (status === BOOKING_STATUS.APPROVED && (Object.prototype.hasOwnProperty.call(Booking, 'findOne') || Booking.db?.readyState === 1)) {
    const raceConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      $or: [{ facility: targetFacility }, { ground: targetFacility }],
      date: booking.date,
      timeSlots: { $in: booking.timeSlots },
      status: 'Approved',
      approvedAt: { $lt: booking.approvedAt },
    });

    if (raceConflict) {
      // Revert this approval immediately to prevent double-booking
      booking.status = BOOKING_STATUS.PENDING;
      booking.approvedBy = undefined;
      booking.approvedAt = undefined;
      await booking.save();

      const conflictErr = new Error('Approval conflict. Another reservation for this slot was confirmed simultaneously.');
      conflictErr.statusCode = 409;
      throw conflictErr;
    }
  }

  await booking.populate('student', 'name email roll branch division classYear');
  return booking;
};

export const getAvailableSlots = async (date, facilityName, allSlots) => {
  // Query ONLY Approved bookings for this facility and date (Pending bookings do NOT block slots)
  const query = Booking.find({ 
    date, 
    $or: [{ facility: facilityName }, { ground: facilityName }],
    status: 'Approved' 
  });
  const approvedBookings = (query && typeof query.lean === 'function') ? await query.lean() : await query;
  
  const bookedTimes = [...new Set(approvedBookings.flatMap(b => b.timeSlots || []))];

  const slots = allSlots.map((slot) => {
    const match = approvedBookings.find((b) => b.timeSlots && b.timeSlots.includes(slot));
    return {
      slot,
      status: match ? 'Booked' : 'Vacant', // Only 'Approved' bookings make a slot 'Booked'
      bookedBy: match ? 'Occupied by an approved reservation' : null,
      game: match ? match.game : null,
      bookingStatus: match ? match.status : null
    };
  });

  return { slots, bookedTimes };
};
