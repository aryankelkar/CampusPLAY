# 🎨 CampusPlay Theme - Quick Reference Card

**Sport & Nature Harmony Theme - Cheat Sheet**

---

## 🎯 Import Statement

```typescript
import { 
  BUTTON_CLASSES, 
  CARD_CLASSES, 
  BADGE_CLASSES,
  ANIMATION_CLASSES,
  COLORS,
  GRADIENTS 
} from '@/constants/theme';
```

---

## 🪄 Buttons

```jsx
// Primary (gradient button)
<button className="btn btn-primary">Book Now</button>

// Secondary (gray button)
<button className="btn btn-secondary">Cancel</button>

// Outline (bordered button)
<button className="btn btn-outline">Details</button>

// Ghost (transparent button)
<button className="btn btn-ghost">Skip</button>
```

---

## 🧩 Cards

```jsx
// Basic glass card
<div className="card">Content</div>

// Interactive (clickable)
<div className="card-interactive">Click me</div>

// With status stripe
<div className="card-status card-status-success">Approved</div>
<div className="card-status card-status-warning">Pending</div>
<div className="card-status card-status-error">Rejected</div>
```

---

## 🎭 Badges

```jsx
<span className="badge badge-green">Approved</span>
<span className="badge badge-yellow">Pending</span>
<span className="badge badge-red">Rejected</span>
<span className="badge badge-blue">Info</span>
<span className="badge badge-gray">Cancelled</span>
```

---

## 🧭 Navbar

```jsx
<nav className="navbar-glass">
  <a className="nav-link nav-link-active">Home</a>
  <a className="nav-link">Bookings</a>
</nav>
```

---

## ⚡ Animations

```jsx
<div className="animate-fade-in">Fade in</div>
<div className="animate-fade-up">Fade up</div>
<div className="animate-slide-up">Slide up</div>
<div className="animate-scale-in">Scale in</div>
<div className="animate-pulse-glow">Pulse glow</div>
```

---

## 🎨 Gradients

```jsx
// Gradient text
<h1 className="text-gradient-sport">Heading</h1>

// Gradient backgrounds
<div className="bg-gradient-sport">Sport</div>
<div className="bg-gradient-nature">Nature</div>
<div className="bg-gradient-hero">Hero</div>
```

---

## 🎭 Modal

```jsx
<div className="modal-backdrop">
  <div className="modal-content">
    <div className="modal-header-gradient p-6">
      <h2>Title</h2>
    </div>
    <div className="p-6">Content</div>
  </div>
</div>
```

---

## 📊 Progress

```jsx
// Progress bar
<div className="progress-bar">
  <div className="bar" style={{ width: '60%' }}></div>
</div>

// Step indicators
<div className="step-indicator completed">✓</div>
<div className="step-indicator active">2</div>
<div className="step-indicator pending">3</div>
```

---

## 🔔 Toasts

```jsx
<div className="toast toast-success">✅ Success!</div>
<div className="toast toast-error">❌ Error!</div>
<div className="toast toast-info">ℹ️ Info</div>
```

---

## 🎨 Colors (inline styles)

```jsx
// Using color constants
<div style={{ backgroundColor: COLORS.primary.DEFAULT }} />
<div style={{ color: COLORS.text.heading }} />

// Using gradients
<div style={{ background: GRADIENTS.sport }} />
```

---

## 📝 Form Inputs

```jsx
<input className="input" type="text" placeholder="Enter text" />
<select className="input">...</select>
<textarea className="input">...</textarea>
```

---

## 🏃 Sport Emojis

```typescript
import { SPORT_EMOJIS } from '@/constants/theme';

{SPORT_EMOJIS.football}     // ⚽
{SPORT_EMOJIS.cricket}      // 🏏
{SPORT_EMOJIS.basketball}   // 🏀
{SPORT_EMOJIS.badminton}    // 🏸
{SPORT_EMOJIS.tennis}       // 🎾
{SPORT_EMOJIS.volleyball}   // 🏐
```

---

## 🎯 Color Codes

```
Primary:    #34D399  (Fresh green)
Accent:     #2563EB  (Lake blue)
Secondary:  #F97316  (Energy orange)
Success:    #22C55E  (Turf green)
Warning:    #FBBF24  (Amber)
Error:      #DC2626  (Red)
```

---

## 📐 Spacing

```
Border Radius (Sport):  rounded-sport  (10px)
Border Radius (Card):   rounded-card   (12px)
Shadow (Sport):         shadow-sport
Shadow (Glass):         shadow-glass
Shadow (Card):          shadow-card
```

---

## 🔥 Common Patterns

### Booking Card
```jsx
<div className="card-status card-status-success">
  <div className="p-4">
    <div className="flex justify-between">
      <div>
        <span className="text-2xl">⚽</span>
        <h4 className="font-semibold">Football Ground A</h4>
      </div>
      <span className="badge badge-green">Approved</span>
    </div>
  </div>
</div>
```

### Hero Section
```jsx
<div className="page-hero bg-gradient-hero">
  <h1 className="text-gradient-sport text-4xl font-bold">
    Book. Play. Compete. 🌿
  </h1>
  <button className="btn btn-primary mt-6">
    Get Started →
  </button>
</div>
```

### Stats Widget
```jsx
<div className="card">
  <div className="p-4 text-center">
    <div className="text-3xl">📅</div>
    <div className="text-2xl font-bold text-primary">24</div>
    <div className="text-sm text-muted">Total Bookings</div>
  </div>
</div>
```

---

## ✅ Quick Checklist

- [ ] All buttons use `.btn` class
- [ ] Cards use `.card` variants
- [ ] Status colors match semantics
- [ ] Animations are under 250ms
- [ ] Sport emojis used for grounds
- [ ] Gradient text for hero headings
- [ ] Glass effect on navbars
- [ ] Status stripes on booking cards

---

**See THEME_GUIDE.md for detailed documentation**
