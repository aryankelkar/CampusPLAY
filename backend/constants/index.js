// Booking Status Enum
export const BOOKING_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

// Email Domains
export const ALLOWED_EMAIL_DOMAINS = ['@vit.edu.in'];
export const ADMIN_EMAIL = 'admin@campusplay.com';

// Booking Constraints
export const MAX_TEAM_MEMBERS = 10;

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
];

// Academic Fields
export const BRANCHES = ['INFT', 'CMPN', 'EXTC', 'EXCS', 'BIOMED'];
export const DIVISIONS = ['A', 'B', 'C', 'D'];
export const CLASS_YEARS = ['FE', 'SE', 'TE', 'BE'];

// Roll Number Pattern
export const ROLL_NUMBER_PATTERN = /^\d{2}[A-Z]{2}\d[A-Z]\d{2}[A-Z]{2}$/;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_EMAIL_DOMAIN: 'Only official college emails ending with @vit.edu.in are allowed.',
  USER_EXISTS: 'User already exists',
  ROLL_EXISTS: 'Roll number already registered',
  INVALID_CREDENTIALS: 'Invalid credentials',
  BOOKING_NOT_FOUND: 'Booking not found',
  NOT_AUTHORIZED: 'Not authorized',
  SLOT_BOOKED: '❌ This slot is already booked. Please choose another time.',
  SERVER_ERROR: 'Server error',
};
