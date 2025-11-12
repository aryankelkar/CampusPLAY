/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // 🎨 Sport & Nature Harmony Theme - CampusPlay
        primary: {
          DEFAULT: '#34D399', // Fresh field grass tone
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
        accent: {
          DEFAULT: '#2563EB', // Cool lake blue
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
        secondary: {
          DEFAULT: '#F97316', // Active energy orange
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
        success: {
          DEFAULT: '#22C55E', // Turf green
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
        warning: {
          DEFAULT: '#FBBF24', // Amber
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
        error: {
          DEFAULT: '#DC2626', // Red
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
      },
      backgroundColor: {
        'base': '#F0FDF4', // Muted pale green background
        'surface': '#FFFFFF', // Clean white
      },
      textColor: {
        'primary': {
          DEFAULT: '#1E293B', // Deep charcoal
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        'muted': '#64748B', // Muted gray-blue
      },
      // 🌈 Gradient utilities for Sport & Nature theme
      backgroundImage: {
        'gradient-sport': 'linear-gradient(90deg, #22C55E, #2563EB)',
        'gradient-sport-hover': 'linear-gradient(90deg, #16A34A, #1D4ED8)',
        'gradient-nature': 'linear-gradient(135deg, #ECFDF5, #EFF6FF)',
        'gradient-energy': 'linear-gradient(90deg, #F97316, #FBBF24)',
        'gradient-hero': 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'sport': '0 4px 10px rgba(34, 197, 94, 0.3)',
        'sport-hover': '0 6px 14px rgba(34, 197, 94, 0.4)',
        'card': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'sport': '10px',
        'card': '12px',
      },
      letterSpacing: {
        'heading': '0.03em',
        'button': '0.02em',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-up': 'fadeUp 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'glow': 'glow 200ms ease-out',
        'progress-fill': 'progressFill 2.5s ease forwards',
        'checkmark': 'checkmark 500ms ease-out forwards',
        'bounce-subtle': 'bounceSubtle 400ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
          '100%': { boxShadow: '0 0 20px 5px rgba(34, 197, 94, 0)' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        checkmark: {
          '0%': { strokeDasharray: '0, 100', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { strokeDasharray: '100, 0', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
