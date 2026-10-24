import { BOOKING_STATUS, STATUS_COLORS, STATUS_ICONS, BookingStatus, ADMIN_EMAIL, ROLL_NUMBER_PATTERN } from '../constants';

/**
 * Get status badge classes
 */
export function getStatusBadgeClass(status: BookingStatus): string {
  return `badge ${STATUS_COLORS[status]?.badge || STATUS_COLORS[BOOKING_STATUS.PENDING].badge}`;
}

/**
 * Get status icon
 */
export function getStatusIcon(status: BookingStatus): string {
  return STATUS_ICONS[status] || STATUS_ICONS[BOOKING_STATUS.PENDING];
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 */
export function formatDate(date: string): string {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format short date for display (e.g., "12 Aug 2026")
 */
export function formatShortDate(date: string): string {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get month-year label from YYYY-MM format
 */
export function getMonthYearLabel(key: string): string {
  return new Date(key + '-01T00:00:00').toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Extract hour from time slot string (e.g., "8–9 AM" -> 8)
 */
export function extractSlotHour(slot: string): number {
  const match = slot.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Check if date is today
 */
export function isToday(date: string): boolean {
  return date === getTodayDate();
}

/**
 * Validate email domain
 */
export function isValidCollegeEmail(email: string, allowAdmin = true): boolean {
  if (allowAdmin && email === ADMIN_EMAIL) return true;
  return email.endsWith('@vit.edu.in');
}

/**
 * Validate roll number format - Allow any alphanumeric string up to 10 characters
 */
export function isValidRollNumber(roll: string): boolean {
  return ROLL_NUMBER_PATTERN.test(roll);
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Show toast notification helper
 */
export function showToast(
  setToast: (value: string | null) => void,
  message: string,
  duration = 2000
): void {
  setToast(message);
  setTimeout(() => setToast(null), duration);
}

/**
 * Get display time - supports both legacy 'time' and new 'timeSlots' format
 */
export function getDisplayTime(booking: any): string {
  if (booking.timeSlots && booking.timeSlots.length > 0) {
    return booking.timeSlots.join(', ');
  }
  return booking.time || 'N/A';
}

/**
 * Validate phone number format (Indian 10-digit starting with 6-9 or E.164 international)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    const digitsOnly = trimmed.slice(1).replace(/[\s\-()]/g, '');
    if (!/^\d{8,15}$/.test(digitsOnly) || /^(\d)\1+$/.test(digitsOnly)) return false;
    if (digitsOnly.startsWith('91')) {
      const indian = digitsOnly.slice(2);
      return /^[6-9]\d{9}$/.test(indian) && !/^(\d)\1{9}$/.test(indian);
    }
    return true;
  }
  let digits = trimmed.replace(/[\s\-()]/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) && !/^(\d)\1{9}$/.test(digits);
}

