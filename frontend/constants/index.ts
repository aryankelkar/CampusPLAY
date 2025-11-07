// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

// Email Validation
export const ALLOWED_EMAIL_DOMAIN = '@vit.edu.in';
export const ADMIN_EMAIL = 'admin@campusplay.com';

// Academic Constants
export const BRANCHES = ['INFT', 'CMPN', 'EXTC', 'EXCS', 'BIOMED'] as const;
export const DIVISIONS = ['A', 'B', 'C', 'D'] as const;
export const CLASS_YEARS = ['FE', 'SE', 'TE', 'BE'] as const;

// Sports/Games
export const GAMES = ['Cricket', 'Football', 'Volleyball', 'Badminton'] as const;

// Grounds
export const GROUNDS = ['Ground 1', 'Ground 2'] as const;

// Time Slots
export const TIME_SLOTS = [
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
] as const;

// Booking Constraints
export const MAX_TEAM_MEMBERS = 10;
export const MAX_TOTAL_PLAYERS = 11; // Including the booking student

// Roll Number Pattern
export const ROLL_NUMBER_PATTERN = /^\d{2}[A-Z]{2}\d[A-Z]\d{2}[A-Z]{2}$/;

// Status Colors (Tailwind classes)
export const STATUS_COLORS = {
  [BOOKING_STATUS.APPROVED]: {
    badge: 'bg-green-100 text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    ring: 'ring-green-300',
  },
  [BOOKING_STATUS.REJECTED]: {
    badge: 'bg-red-100 text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-300',
  },
  [BOOKING_STATUS.PENDING]: {
    badge: 'bg-yellow-100 text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    ring: 'ring-yellow-300',
  },
  [BOOKING_STATUS.CANCELLED]: {
    badge: 'bg-gray-100 text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    ring: 'ring-gray-300',
  },
} as const;

// Status Icons
export const STATUS_ICONS = {
  [BOOKING_STATUS.APPROVED]: '✅',
  [BOOKING_STATUS.REJECTED]: '❌',
  [BOOKING_STATUS.PENDING]: '🕒',
  [BOOKING_STATUS.CANCELLED]: '🚫',
} as const;

// Theme Colors (consistent across app)
export const THEME = {
  primary: '#3B82F6', // blue-500
  primaryDark: '#1E40AF', // blue-800
  success: '#22C55E', // green-500
  successDark: '#16A34A', // green-600
  error: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
  background: 'linear-gradient(90deg, #DBF4FF, #ECFDF5)',
  navbarGradient: 'linear-gradient(90deg, #3B82F6, #22C55E)',
  cardShadow: '0 4px 16px rgba(0,0,0,0.05)',
} as const;
