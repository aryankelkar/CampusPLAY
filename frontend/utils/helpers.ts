import { BOOKING_STATUS, STATUS_COLORS, STATUS_ICONS, BookingStatus } from '../constants';

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
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
  if (allowAdmin && email === 'admin@campusplay.com') return true;
  return email.endsWith('@vit.edu.in');
}

/**
 * Validate roll number format - Allow any alphanumeric string up to 10 characters
 */
export function isValidRollNumber(roll: string): boolean {
  return /^[A-Za-z0-9]{1,10}$/.test(roll);
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
