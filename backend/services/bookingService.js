import Booking from '../models/Booking.js';
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUS } from '../constants/index.js';

/**
 * Booking Service Layer
 * Consolidates business logic for booking operations
 */

export const findBookingById = async (id) => {
  return await Booking.findById(id).populate('student', 'name email roll branch division classYear');
};

/**
 * Canonical definition of an active (slot-occupying) booking:
 * status is Pending or Approved. Rejected and Cancelled bookings free the slot.
 * This query is the single source of truth for conflict detection and
 * availability, and mirrors the partial unique index on the Booking model.
 */
export const activeBookingQuery = (ground, date, time) => ({
  ground,
  date,
  ...(time ? { time } : {}),
  status: { $in: ACTIVE_BOOKING_STATUSES },
});

export const findActiveBookings = async (ground, date) =>
  Booking.find(activeBookingQuery(ground, date));

export const checkSlotConflict = async (ground, date, time, excludeId = null) => {
  const query = activeBookingQuery(ground, date, time);
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
      booking.canceledBy = metadata.canceledBy;
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
  const conflict = await checkSlotConflict(bookingData.ground, bookingData.date, bookingData.time);

  if (conflict) {
    throw new Error('SLOT_BOOKED');
  }

  // Create booking with user snapshot. The partial unique index on the
  // collection remains the final safeguard against concurrent inserts.
  const booking = await Booking.create({
    ...bookingData,
    ...userSnapshot,
    student: userId,
    status: BOOKING_STATUS.PENDING,
  });

  return booking;
};

export const getAvailableSlots = async (date, ground, allSlots) => {
  const bookings = await findActiveBookings(ground, date);
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
