/**
 * 🎨 CampusPlay - Sport & Nature Harmony Theme
 * 
 * A modern UI theme blending sporty energy with natural calm.
 * Design philosophy: Light-dark hybrid with earthy tones + athletic accents.
 * 
 * Theme Keywords: #nature-tech, #active-campus, #sports-energy, #eco-modern, #glass-clean
 */

// 🌈 COLOR PALETTE - Sport & Nature Harmony
export const COLORS = {
  // Primary Green - Fresh field grass tone (energetic and natural)
  primary: {
    DEFAULT: '#34D399',
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#14532D', // Forest green for headings
  },

  // Accent Blue - Cool lake blue for contrast and trust
  accent: {
    DEFAULT: '#2563EB',
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Support Orange - Active energy accent (used rarely, e.g., highlights)
  secondary: {
    DEFAULT: '#F97316',
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Success - Turf green for approved bookings
  success: {
    DEFAULT: '#22C55E',
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Warning - Amber for pending
  warning: {
    DEFAULT: '#FBBF24',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Error - Red for rejected or failed actions
  error: {
    DEFAULT: '#DC2626',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Background colors
  background: {
    base: '#F0FDF4', // Muted pale green background
    surface: '#FFFFFF', // Clean white
  },

  // Text colors
  text: {
    primary: '#1E293B', // Deep charcoal for contrast
    muted: '#64748B', // Muted gray-blue tone
    heading: '#14532D', // Forest green for headings
  },
} as const;

// 🌈 GRADIENT UTILITIES
export const GRADIENTS = {
  sport: 'linear-gradient(90deg, #22C55E, #2563EB)',
  sportHover: 'linear-gradient(90deg, #16A34A, #1D4ED8)',
  nature: 'linear-gradient(135deg, #ECFDF5, #EFF6FF)',
  energy: 'linear-gradient(90deg, #F97316, #FBBF24)',
  hero: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
} as const;

// ✍️ TYPOGRAPHY - Clean & Confident
export const TYPOGRAPHY = {
  fontFamily: {
    heading: 'var(--font-poppins), sans-serif',
    body: 'var(--font-inter), sans-serif',
  },
  fontSize: {
    h1: '2.5rem', // 40px - "Book. Play. Compete."
    h2: '1.75rem', // 28px
    h3: '1.25rem', // 20px
    h4: '1.125rem', // 18px
    body: '1rem', // 16px
  },
  fontWeight: {
    heading: 600,
    headingBold: 700,
    button: 600,
    body: 400,
    bodyMedium: 500,
  },
  letterSpacing: {
    heading: '0.03em',
    button: '0.02em',
  },
  lineHeight: {
    heading: 1.2,
    body: 1.6,
  },
} as const;

// 🪄 BUTTON STYLES
export const BUTTON_CLASSES = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  outline: 'btn btn-outline',
  ghost: 'btn btn-ghost',
} as const;

// 🧩 CARD STYLES
export const CARD_CLASSES = {
  base: 'card',
  interactive: 'card-interactive',
  statusSuccess: 'card-status card-status-success',
  statusWarning: 'card-status card-status-warning',
  statusError: 'card-status card-status-error',
  statusInfo: 'card-status card-status-info',
} as const;

// 🎭 BADGE STYLES
export const BADGE_CLASSES = {
  yellow: 'badge badge-yellow',
  green: 'badge badge-green',
  red: 'badge badge-red',
  blue: 'badge badge-blue',
  gray: 'badge badge-gray',
} as const;

// 🧭 NAVBAR CLASSES
export const NAVBAR_CLASSES = {
  glass: 'navbar-glass',
  link: 'nav-link',
  linkActive: 'nav-link nav-link-active',
} as const;

// ⚡ ANIMATION CLASSES
export const ANIMATION_CLASSES = {
  fadeIn: 'animate-fade-in',
  fadeUp: 'animate-fade-in-up',
  slideUp: 'animate-slide-up',
  slideInRight: 'animate-slide-in-right',
  scaleIn: 'animate-scale-in',
  checkmark: 'animate-checkmark',
  pulseGlow: 'animate-pulse-glow',
} as const;

// 📐 SPACING & LAYOUT
export const SPACING = {
  borderRadius: {
    sport: '10px',
    card: '12px',
  },
  boxShadow: {
    glass: '0 2px 10px rgba(0, 0, 0, 0.1)',
    glassHover: '0 4px 20px rgba(0, 0, 0, 0.15)',
    sport: '0 4px 10px rgba(34, 197, 94, 0.3)',
    sportHover: '0 6px 14px rgba(34, 197, 94, 0.4)',
    card: '0 2px 10px rgba(0, 0, 0, 0.1)',
    cardHover: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
} as const;

// 🎭 MODAL CLASSES
export const MODAL_CLASSES = {
  backdrop: 'modal-backdrop',
  content: 'modal-content',
  headerGradient: 'modal-header-gradient',
} as const;

// 📊 PROGRESS CLASSES
export const PROGRESS_CLASSES = {
  bar: 'progress-bar',
  stepIndicator: 'step-indicator',
  stepActive: 'step-indicator active',
  stepCompleted: 'step-indicator completed',
  stepPending: 'step-indicator pending',
} as const;

// 🔔 TOAST CLASSES
export const TOAST_CLASSES = {
  success: 'toast toast-success',
  error: 'toast toast-error',
  info: 'toast toast-info',
} as const;

// 🎯 BOOKING STATUS MAPPING
export const STATUS_COLORS = {
  approved: COLORS.success.DEFAULT,
  pending: COLORS.warning.DEFAULT,
  rejected: COLORS.error.DEFAULT,
  cancelled: COLORS.text.muted,
} as const;

export const STATUS_BADGE_CLASSES = {
  approved: BADGE_CLASSES.green,
  pending: BADGE_CLASSES.yellow,
  rejected: BADGE_CLASSES.red,
  cancelled: BADGE_CLASSES.gray,
} as const;

export const STATUS_CARD_CLASSES = {
  approved: CARD_CLASSES.statusSuccess,
  pending: CARD_CLASSES.statusWarning,
  rejected: CARD_CLASSES.statusError,
} as const;

// 🏃 SPORT ICONS & EMOJIS
export const SPORT_EMOJIS = {
  football: '⚽',
  cricket: '🏏',
  basketball: '🏀',
  badminton: '🏸',
  tennis: '🎾',
  volleyball: '🏐',
  tableTennis: '🏓',
  athletics: '🏃',
} as const;

// 🎨 THEME SUMMARY
export const THEME_SUMMARY = {
  name: 'Sport & Nature Harmony',
  description: 'A modern UI theme blending sporty energy with natural calm',
  keywords: ['nature-tech', 'active-campus', 'sports-energy', 'eco-modern', 'glass-clean'],
  primaryColor: COLORS.primary.DEFAULT,
  accentColor: COLORS.accent.DEFAULT,
  backgroundColor: COLORS.background.base,
  transitionDuration: '200ms',
  animationTiming: 'ease-out',
} as const;

// 💡 Usage Example:
/*
  import { COLORS, BUTTON_CLASSES, ANIMATION_CLASSES } from '@/constants/theme';

  // Using colors
  <div style={{ backgroundColor: COLORS.primary.DEFAULT }}>

  // Using button classes
  <button className={BUTTON_CLASSES.primary}>Book Now</button>

  // Using animations
  <div className={ANIMATION_CLASSES.fadeUp}>Content</div>

  // Using gradient text
  <h1 className="text-gradient-sport">Book. Play. Compete.</h1>
*/
