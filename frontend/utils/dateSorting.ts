/**
 * Date & Time Slot sorting utilities for CampusPLAY
 * Provides chronological sorting aware of dates, multi-slot 12-hour AM/PM schedules,
 * and request creation timestamps.
 */

/**
 * Parse time string or slot string into minutes from midnight (0 to 1439).
 * Correctly handles:
 * - "8-9 AM", "8–9 AM" -> 8:00 AM (480 mins)
 * - "11-12 AM", "11–12 AM" -> 11:00 AM (660 mins)
 * - "12-1 PM", "12–1 PM" -> 12:00 PM / Noon (720 mins)
 * - "1-2 PM", "1–2 PM" -> 1:00 PM / 13:00 (780 mins)
 * - "4-5 PM", "5-6 PM" -> 4:00 PM (960 mins) / 5:00 PM (1020 mins)
 * - 24-hour strings: "14:30" (870 mins), "09:00" (540 mins)
 * - 12-hour strings: "9:00 AM", "4:30 PM"
 */
export function parseSlotTimeToMinutes(slotStr?: string): number {
  if (!slotStr || typeof slotStr !== 'string') return 0;
  const str = slotStr.trim();
  if (!str) return 0;

  // 1. Check direct 24h or 12h time format like "14:30", "09:00", "9:00 AM", "4:15 PM"
  const directMatch = str.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (directMatch) {
    let h = parseInt(directMatch[1], 10);
    const m = parseInt(directMatch[2], 10);
    const mod = (directMatch[3] || '').toUpperCase();
    if (mod === 'PM' && h < 12) h += 12;
    if (mod === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  // 2. Check slot ranges like "8-9 AM", "8–9 AM", "12-1 PM", "4-5 PM"
  const rangeMatch = str.match(/^(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (rangeMatch) {
    let startHour = parseInt(rangeMatch[1], 10);
    const startMin = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const modifier = (rangeMatch[5] || '').toUpperCase();

    if (modifier === 'PM') {
      if (startHour < 12) startHour += 12;
    } else if (modifier === 'AM') {
      if (startHour === 12) startHour = 0;
    } else {
      // Standard college hours heuristics: 1-7 is afternoon PM (13:00-19:00), 8-11 is morning AM
      if (startHour >= 1 && startHour <= 7) startHour += 12;
    }
    return startHour * 60 + startMin;
  }

  // 3. Simple fallback for "4 PM", "9 AM", etc.
  const simpleMatch = str.match(/^(\d{1,2})\s*(AM|PM)?/i);
  if (simpleMatch) {
    let h = parseInt(simpleMatch[1], 10);
    const mod = (simpleMatch[2] || '').toUpperCase();
    if (mod === 'PM' && h < 12) h += 12;
    if (mod === 'AM' && h === 12) h = 0;
    if (!mod && h >= 1 && h <= 7) h += 12;
    return h * 60;
  }

  return 0;
}

/**
 * Get earliest start time in minutes from a booking object (supports ground & equipment bookings).
 */
export function getBookingStartTimeInMinutes(booking: any): number {
  if (!booking) return 0;

  // Ground booking: timeSlots array (e.g. ["4-5 PM", "5-6 PM"])
  if (Array.isArray(booking.timeSlots) && booking.timeSlots.length > 0) {
    const minutesList = booking.timeSlots.map((s: string) => parseSlotTimeToMinutes(s));
    return Math.min(...minutesList);
  }

  // Legacy ground booking: comma-separated or single string
  if (booking.time && typeof booking.time === 'string') {
    const parts = booking.time.split(',');
    const minutesList = parts.map((p: string) => parseSlotTimeToMinutes(p));
    return Math.min(...minutesList);
  }

  // Equipment booking: collectionTime
  if (booking.collectionTime && typeof booking.collectionTime === 'string') {
    return parseSlotTimeToMinutes(booking.collectionTime);
  }

  return 0;
}

/**
 * Calculate precise epoch millisecond timestamp for the booking event (Date + Start Time Slot).
 */
export function getBookingEventTimestamp(booking: any): number {
  if (!booking) return 0;
  if (!booking.date) {
    return booking.createdAt ? new Date(booking.createdAt).getTime() : 0;
  }

  // Expecting "YYYY-MM-DD"
  const parts = String(booking.date).split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const startMins = getBookingStartTimeInMinutes(booking);
    const hours = Math.floor(startMins / 60);
    const mins = startMins % 60;
    return new Date(year, month, day, hours, mins, 0, 0).getTime();
  }

  const d = new Date(booking.date);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Calculate precise epoch millisecond timestamp for when the booking was requested/submitted.
 */
export function getBookingRequestTimestamp(booking: any): number {
  if (!booking) return 0;
  if (booking.createdAt) {
    const t = new Date(booking.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  return getBookingEventTimestamp(booking);
}

export type SortDateOption = 'event-desc' | 'event-asc' | 'created-desc' | 'created-asc';

/**
 * Sorts any list of bookings with correct, bulletproof chronological logic.
 */
export function sortBookings<T>(list: T[], sortOption: SortDateOption): T[] {
  return [...list].sort((a: any, b: any) => {
    if (sortOption === 'event-desc') {
      const diff = getBookingEventTimestamp(b) - getBookingEventTimestamp(a);
      if (diff !== 0) return diff;
      return getBookingRequestTimestamp(b) - getBookingRequestTimestamp(a);
    }

    if (sortOption === 'event-asc') {
      const diff = getBookingEventTimestamp(a) - getBookingEventTimestamp(b);
      if (diff !== 0) return diff;
      return getBookingRequestTimestamp(a) - getBookingRequestTimestamp(b);
    }

    if (sortOption === 'created-desc') {
      const diff = getBookingRequestTimestamp(b) - getBookingRequestTimestamp(a);
      if (diff !== 0) return diff;
      return getBookingEventTimestamp(b) - getBookingEventTimestamp(a);
    }

    if (sortOption === 'created-asc') {
      const diff = getBookingRequestTimestamp(a) - getBookingRequestTimestamp(b);
      if (diff !== 0) return diff;
      return getBookingEventTimestamp(a) - getBookingEventTimestamp(b);
    }

    return 0;
  });
}
