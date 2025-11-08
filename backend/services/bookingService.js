import Booking from '../models/Booking.js';
import { BOOKING_STATUS } from '../constants/index.js';

/**
 * Booking Service Layer
 * Consolidates business logic for booking operations
 */

export const findBookingById = async (id) => {
  return await Booking.findById(id).populate('student', 'name email roll branch division classYear');
};

export const checkSlotConflict = async (ground, date, time, excludeId = null) => {
  const query = { ground, date, time, status: BOOKING_STATUS.APPROVED };
  if (excludeId) query._id = { $ne: excludeId };
  return await Booking.findOne(query);
};

export const getBookingsByFilter = async (filter, sort = { createdAt: -1 }) => {
  return await Booking.find(filter)
    .populate('student', 'name email roll branch division classYear')
    .sort(sort);
};

export const updateBookingStatus = async (bookingId, status, metadata = {}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  booking.status = status;

  // Apply metadata based on status
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
      // Keep audit trail but mark as pending
      break;
  }

  await booking.save();
  await booking.populate('student', 'name email roll branch division classYear');
  return booking;
};

export const createBookingWithValidation = async (bookingData, userId, userSnapshot) => {
  // Check for slot conflict
  const conflict = await Booking.findOne({
    ground: bookingData.ground,
    date: bookingData.date,
    time: bookingData.time,
  });

  if (conflict) {
    throw new Error('SLOT_BOOKED');
  }

  // Create booking with user snapshot
  const booking = await Booking.create({
    ...bookingData,
    ...userSnapshot,
    student: userId,
    status: BOOKING_STATUS.PENDING,
  });

  return booking;
};

export const getAvailableSlots = async (date, ground, allSlots) => {
  const bookings = await Booking.find({ date, ground, status: BOOKING_STATUS.APPROVED });
  const bookedTimes = bookings.map((b) => b.time);

  const slots = allSlots.map((slot) => {
    const match = bookings.find((b) => b.time === slot);
    return {
      slot,
      status: match ? 'Booked' : 'Vacant',
      bookedBy: match ? (match.name || match.student?.name || null) : null,
      game: match ? match.game : null,
    };
  });

  return { slots, bookedTimes };
};
