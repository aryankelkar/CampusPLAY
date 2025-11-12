/**
 * 🎨 CampusPlay Theme Examples
 * 
 * This file demonstrates how to use the Sport & Nature Harmony theme
 * in various components. Use as reference for implementing theme across the app.
 * 
 * NOTE: This is a reference file. Import what you need, don't include this entire file.
 */

import React from 'react';
import {
  BUTTON_CLASSES,
  CARD_CLASSES,
  BADGE_CLASSES,
  ANIMATION_CLASSES,
  NAVBAR_CLASSES,
  TOAST_CLASSES,
  PROGRESS_CLASSES,
  SPORT_EMOJIS,
  COLORS,
  GRADIENTS,
} from '@/constants/theme';

// =========================================
// 🪄 BUTTON EXAMPLES
// =========================================

export const ButtonExamples = () => {
  return (
    <div className="space-y-4">
      {/* Primary action button with sport gradient */}
      <button className={BUTTON_CLASSES.primary}>
        Book Ground Now
      </button>

      {/* Secondary button for cancel/back actions */}
      <button className={BUTTON_CLASSES.secondary}>
        Cancel
      </button>

      {/* Outline button for secondary actions */}
      <button className={BUTTON_CLASSES.outline}>
        View Details
      </button>

      {/* Ghost button for tertiary actions */}
      <button className={BUTTON_CLASSES.ghost}>
        Skip
      </button>
    </div>
  );
};

// =========================================
// 🧩 CARD EXAMPLES
// =========================================

export const CardExamples = () => {
  return (
    <div className="space-y-4">
      {/* Basic glass card */}
      <div className={CARD_CLASSES.base}>
        <div className="p-6">
          <h3>Your Booking Details</h3>
          <p>Content goes here</p>
        </div>
      </div>

      {/* Interactive clickable card */}
      <div className={CARD_CLASSES.interactive}>
        <div className="p-6">
          <h3>Click to expand</h3>
        </div>
      </div>

      {/* Status cards with colored stripes */}
      <div className={CARD_CLASSES.statusSuccess}>
        <div className="p-4">
          <span className={BADGE_CLASSES.green}>Approved</span>
          <p className="mt-2">Football Ground A - Tomorrow 4 PM</p>
        </div>
      </div>

      <div className={CARD_CLASSES.statusWarning}>
        <div className="p-4">
          <span className={BADGE_CLASSES.yellow}>Pending</span>
          <p className="mt-2">Basketball Court - Next Week</p>
        </div>
      </div>

      <div className={CARD_CLASSES.statusError}>
        <div className="p-4">
          <span className={BADGE_CLASSES.red}>Rejected</span>
          <p className="mt-2">Cricket Ground - Unavailable</p>
        </div>
      </div>
    </div>
  );
};

// =========================================
// 🧭 NAVBAR EXAMPLE
// =========================================

export const NavbarExample = () => {
  return (
    <nav className={NAVBAR_CLASSES.glass}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with leaf-green accent */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gradient-sport">
              CampusPlay
            </h1>
            <span style={{ color: COLORS.primary.DEFAULT }}>●</span>
          </div>

          {/* Navigation links */}
          <div className="flex gap-6">
            <a href="/" className={NAVBAR_CLASSES.linkActive}>
              Home
            </a>
            <a href="/book" className={NAVBAR_CLASSES.link}>
              Book
            </a>
            <a href="/history" className={NAVBAR_CLASSES.link}>
              History
            </a>
            <a href="/profile" className={NAVBAR_CLASSES.link}>
              Profile
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

// =========================================
// 🎭 BADGE EXAMPLES
// =========================================

export const BadgeExamples = () => {
  return (
    <div className="flex gap-3">
      <span className={BADGE_CLASSES.green}>Approved</span>
      <span className={BADGE_CLASSES.yellow}>Pending</span>
      <span className={BADGE_CLASSES.red}>Rejected</span>
      <span className={BADGE_CLASSES.blue}>In Review</span>
      <span className={BADGE_CLASSES.gray}>Cancelled</span>
    </div>
  );
};

// =========================================
// ⚡ ANIMATION EXAMPLES
// =========================================

export const AnimationExamples = () => {
  return (
    <div className="space-y-4">
      {/* Fade in */}
      <div className={ANIMATION_CLASSES.fadeIn}>
        Fades in smoothly
      </div>

      {/* Fade up from bottom */}
      <div className={ANIMATION_CLASSES.fadeUp}>
        Slides up and fades in
      </div>

      {/* Scale from center */}
      <div className={ANIMATION_CLASSES.scaleIn}>
        Scales from center
      </div>

      {/* Pulse glow for success */}
      <button className={`${BUTTON_CLASSES.primary} ${ANIMATION_CLASSES.pulseGlow}`}>
        Success State
      </button>
    </div>
  );
};

// =========================================
// 🎭 MODAL EXAMPLE
// =========================================

export const ModalExample = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button 
        className={BUTTON_CLASSES.primary}
        onClick={() => setIsOpen(true)}
      >
        Open Modal
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div 
            className="modal-backdrop absolute inset-0"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal content */}
          <div className="modal-content relative z-10 max-w-md w-full mx-4">
            {/* Gradient header */}
            <div className="modal-header-gradient p-6">
              <h2 className="text-xl font-semibold" style={{ color: COLORS.text.heading }}>
                Confirm Booking
              </h2>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="mb-4">Are you sure you want to book this ground?</p>
              <div className="flex gap-3 justify-end">
                <button 
                  className={BUTTON_CLASSES.secondary}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className={BUTTON_CLASSES.primary}
                  onClick={() => {
                    // Handle booking
                    setIsOpen(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =========================================
// 📊 PROGRESS EXAMPLES
// =========================================

export const ProgressExamples = () => {
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <p className="text-sm mb-2">Booking Progress</p>
        <div className={PROGRESS_CLASSES.bar}>
          <div className="bar" style={{ width: '60%' }} />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-4">
        <div className={PROGRESS_CLASSES.stepCompleted}>
          <span>✓</span>
        </div>
        <div className="flex-1 h-1 bg-green-500" />
        
        <div className={PROGRESS_CLASSES.stepActive}>
          <span>2</span>
        </div>
        <div className="flex-1 h-1 bg-gray-300" />
        
        <div className={PROGRESS_CLASSES.stepPending}>
          <span>3</span>
        </div>
      </div>
    </div>
  );
};

// =========================================
// 🔔 TOAST EXAMPLES
// =========================================

export const ToastExamples = () => {
  return (
    <div className="space-y-3">
      {/* Success toast */}
      <div className={TOAST_CLASSES.success}>
        <span>✅</span>
        <span>Booking confirmed successfully!</span>
      </div>

      {/* Error toast */}
      <div className={TOAST_CLASSES.error}>
        <span>❌</span>
        <span>Something went wrong. Please try again.</span>
      </div>

      {/* Info toast */}
      <div className={TOAST_CLASSES.info}>
        <span>ℹ️</span>
        <span>Processing your request...</span>
      </div>
    </div>
  );
};

// =========================================
// 🏃 SPORT CARD EXAMPLE
// =========================================

export const SportCardExample = () => {
  return (
    <div className={`${CARD_CLASSES.interactive} ${ANIMATION_CLASSES.fadeUp}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{SPORT_EMOJIS.football}</span>
            <div>
              <h3 className="font-semibold text-lg">Football Ground A</h3>
              <p className="text-sm text-muted">Main Sports Complex</p>
            </div>
          </div>
          <span className={BADGE_CLASSES.green}>Available</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Date:</span>
            <span className="font-medium">Tomorrow, 4:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Duration:</span>
            <span className="font-medium">2 hours</span>
          </div>
        </div>

        <button className={`${BUTTON_CLASSES.primary} w-full mt-4`}>
          Book Now
        </button>
      </div>
    </div>
  );
};

// =========================================
// 🎯 HERO SECTION EXAMPLE
// =========================================

export const HeroExample = () => {
  return (
    <div className="page-hero" style={{ background: GRADIENTS.hero }}>
      <div className={ANIMATION_CLASSES.fadeUp}>
        {/* Main heading with gradient text */}
        <h1 
          className="text-4xl md:text-5xl font-bold mb-4 text-gradient-sport text-center"
        >
          Book. Play. Compete. 🌿
        </h1>
        
        {/* Subtext */}
        <p 
          className="text-xl text-center mb-8" 
          style={{ color: COLORS.text.muted }}
        >
          Book your sports ground in just a few taps
        </p>
        
        {/* CTA Button */}
        <div className="flex justify-center">
          <button className={BUTTON_CLASSES.primary}>
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================
// 📊 DASHBOARD STATS WIDGET
// =========================================

export const DashboardStatsWidget = () => {
  const stats = [
    { label: 'Total Bookings', value: '24', icon: '📅', color: COLORS.primary.DEFAULT },
    { label: 'Approved', value: '18', icon: '✅', color: COLORS.success.DEFAULT },
    { label: 'Pending', value: '4', icon: '⏳', color: COLORS.warning.DEFAULT },
    { label: 'Rejected', value: '2', icon: '❌', color: COLORS.error.DEFAULT },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className={`${CARD_CLASSES.base} ${ANIMATION_CLASSES.scaleIn}`}
        >
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div 
              className="text-2xl font-bold mb-1" 
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-sm text-muted">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// =========================================
// 📋 BOOKING LIST ITEM
// =========================================

export const BookingListItem = ({ booking }: { 
  booking: {
    sport: keyof typeof SPORT_EMOJIS;
    ground: string;
    date: string;
    time: string;
    status: 'approved' | 'pending' | 'rejected';
  }
}) => {
  const statusBadge = {
    approved: BADGE_CLASSES.green,
    pending: BADGE_CLASSES.yellow,
    rejected: BADGE_CLASSES.red,
  }[booking.status];

  const statusText = {
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
  }[booking.status];

  const cardClass = {
    approved: CARD_CLASSES.statusSuccess,
    pending: CARD_CLASSES.statusWarning,
    rejected: CARD_CLASSES.statusError,
  }[booking.status];

  return (
    <div className={cardClass}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{SPORT_EMOJIS[booking.sport]}</span>
            <div>
              <h4 className="font-semibold">{booking.ground}</h4>
              <p className="text-sm text-muted">{booking.date} • {booking.time}</p>
            </div>
          </div>
          <span className={statusBadge}>{statusText}</span>
        </div>
      </div>
    </div>
  );
};

// =========================================
// 🎨 INLINE STYLE EXAMPLES
// =========================================

export const InlineStyleExamples = () => {
  return (
    <div className="space-y-4">
      {/* Using colors directly */}
      <div style={{ 
        backgroundColor: COLORS.primary.DEFAULT,
        color: 'white',
        padding: '1rem',
        borderRadius: '10px',
      }}>
        Primary color background
      </div>

      {/* Using gradients */}
      <div style={{ 
        background: GRADIENTS.sport,
        color: 'white',
        padding: '1rem',
        borderRadius: '10px',
      }}>
        Sport gradient background
      </div>

      {/* Gradient text inline */}
      <h2 style={{
        background: GRADIENTS.sport,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 600,
      }}>
        Gradient Text Heading
      </h2>
    </div>
  );
};

// =========================================
// 📝 FORM EXAMPLE
// =========================================

export const FormExample = () => {
  return (
    <div className={CARD_CLASSES.base}>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.text.heading }}>
          Book a Ground
        </h3>
        
        <form className="space-y-4">
          <div>
            <label className="label block mb-2">Ground Type</label>
            <select className="input">
              <option>Football</option>
              <option>Basketball</option>
              <option>Cricket</option>
            </select>
          </div>

          <div>
            <label className="label block mb-2">Date</label>
            <input type="date" className="input" />
          </div>

          <div>
            <label className="label block mb-2">Time Slot</label>
            <input type="time" className="input" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" className={BUTTON_CLASSES.secondary}>
              Cancel
            </button>
            <button type="submit" className={BUTTON_CLASSES.primary}>
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default {
  ButtonExamples,
  CardExamples,
  NavbarExample,
  BadgeExamples,
  AnimationExamples,
  ModalExample,
  ProgressExamples,
  ToastExamples,
  SportCardExample,
  HeroExample,
  DashboardStatsWidget,
  BookingListItem,
  InlineStyleExamples,
  FormExample,
};
