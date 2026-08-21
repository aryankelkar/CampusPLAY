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
    throw new Error('Sport and Facility are required.');
  }

  // 1. Validate Sport-Facility Mapping
  const matchResult = validateSportFacilityMatch(sport, facilityName);
  if (!matchResult.valid) {
    throw new Error(matchResult.message);
  }

  // 2. Check Facility Active Status
  const facilityRecord = await Facility.findOne({ name: facilityName });
  if (facilityRecord && facilityRecord.status !== 'ACTIVE') {
    throw new Error(`Facility '${facilityName}' is currently under maintenance or temporarily unavailable.`);
  }

  // 3. Create Pending Booking (Note: Pending bookings DO NOT block new submissions!)
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
    const existingApprovedConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      $or: [{ facility: targetFacility }, { ground: targetFacility }],
      date: booking.date,
      timeSlots: { $in: booking.timeSlots },
      status: 'Approved',
    });

    if (existingApprovedConflict) {
      throw new Error('Approval conflict. This facility is already booked for the selected time.');
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
  await booking.populate('student', 'name email roll branch division classYear');
  return booking;
};

export const getAvailableSlots = async (date, facilityName, allSlots) => {
  // Query ONLY Approved bookings for this facility and date (Pending bookings do NOT block slots)
  const approvedBookings = await Booking.find({ 
    date, 
    $or: [{ facility: facilityName }, { ground: facilityName }],
    status: 'Approved' 
  });
  
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
