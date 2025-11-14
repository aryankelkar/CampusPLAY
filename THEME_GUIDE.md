# 🎨 CampusPlay - Sport & Nature Harmony Theme Guide

**A unique modern UI theme blending sporty energy with natural calm**

---

## 🌿 Design Philosophy

CampusPlay uses a **"Sport & Nature Harmony"** theme — a light-dark hybrid that combines:
- 🏃 **Sporty Energy**: Active, vibrant, motivating
- 🌳 **Natural Calm**: Organic, fresh, sustainable
- 🖥️ **Tech Modern**: Clean, accessible, glass-morphism

**Feel**: Fresh, active, and sustainable — like something that lives between nature and technology.

---

## 🎨 Color Palette

### Primary Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary Green** | ![#34D399](https://via.placeholder.com/15/34D399/000000?text=+) | `#34D399` | Fresh field grass tone — energetic and natural |
| **Accent Blue** | ![#2563EB](https://via.placeholder.com/15/2563EB/000000?text=+) | `#2563EB` | Cool lake blue for contrast and trust |
| **Support Orange** | ![#F97316](https://via.placeholder.com/15/F97316/000000?text=+) | `#F97316` | Active energy accent (used rarely) |

### Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Success** | ![#22C55E](https://via.placeholder.com/15/22C55E/000000?text=+) | `#22C55E` | Turf green for approved bookings |
| **Warning** | ![#FBBF24](https://via.placeholder.com/15/FBBF24/000000?text=+) | `#FBBF24` | Amber for pending |
| **Error** | ![#DC2626](https://via.placeholder.com/15/DC2626/000000?text=+) | `#DC2626` | Red for rejected or failed actions |

### Background & Text

| Element | Color | Hex |
|---------|-------|-----|
| Background (Light) | ![#F0FDF4](https://via.placeholder.com/15/F0FDF4/000000?text=+) | `#F0FDF4` - Muted pale green |
| Surface / Card | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) | `#FFFFFF` - Clean white |
| Text Primary | ![#1E293B](https://via.placeholder.com/15/1E293B/000000?text=+) | `#1E293B` - Deep charcoal |
| Text Muted | ![#64748B](https://via.placeholder.com/15/64748B/000000?text=+) | `#64748B` - Muted gray-blue |
| Text Heading | ![#14532D](https://via.placeholder.com/15/14532D/000000?text=+) | `#14532D` - Forest green |

---

## ✍️ Typography

### Font Families
- **Headings**: `Poppins` (Weight: 600-700, Letter-spacing: 0.03em)
- **Body**: `Inter` (Weight: 400-500, Line-height: 1.6)

### Font Scale
```css
H1 → 2.5rem (40px) - "Book. Play. Compete."
H2 → 1.75rem (28px)
H3 → 1.25rem (20px)
H4 → 1.125rem (18px)
Body → 1rem (16px)
```

### Gradient Text (Highlight Effect)
```jsx
<h1 className="text-gradient-sport">Book. Play. Compete.</h1>
```
Applies: `linear-gradient(90deg, #22C55E, #2563EB)` with text-fill

---

## 🪄 Buttons

### Primary Button (Sport Gradient)
```jsx
<button className="btn btn-primary">Book Now</button>
```
- Gradient: `#22C55E → #2563EB`
- Shadow: `0 4px 10px rgba(34, 197, 94, 0.3)`
- Hover: Shifts gradient + scale(1.03)
- Rounded: 10px

### Secondary Button (Cancel / Back)
```jsx
<button className="btn btn-secondary">Cancel</button>
```
- Background: `#F3F4F6`
- Border: `1px solid #CBD5E1`
- Hover: Slight lift

### Outline Button
```jsx
<button className="btn btn-outline">View Details</button>
```

### Ghost Button
```jsx
<button className="btn btn-ghost">Skip</button>
```

---

## 🧩 Cards

### Basic Card (Glass Effect)
```jsx
<div className="card">
  <p>Your content here</p>
</div>
```
- Background: `rgba(255, 255, 255, 0.85)`
- Border: `1px solid rgba(0, 0, 0, 0.05)`
- Shadow: Soft blur
- Hover: Lifts with shadow increase

### Interactive Card (Clickable)
```jsx
<div className="card-interactive">
  <p>Click me!</p>
</div>
```

### Status Cards (With Colored Stripe)
```jsx
<div className="card-status card-status-success">
  Approved Booking
</div>

<div className="card-status card-status-warning">
  Pending Booking
</div>

<div className="card-status card-status-error">
  Rejected Booking
</div>
```
- **Green stripe** → Approved
- **Amber stripe** → Pending
- **Red stripe** → Rejected

---

## 🧭 Navbar (Nature-Tech Fusion)

### Floating Glass Navbar
```jsx
<nav className="navbar-glass">
  <a href="/" className="nav-link nav-link-active">Home</a>
  <a href="/book" className="nav-link">Book</a>
  <a href="/history" className="nav-link">History</a>
</nav>
```

**Features**:
- Semi-transparent with backdrop blur: `blur(10px)`
- Active nav item: Gradient underline from green to blue
- Hover: Color tint to forest green

---

## 🎭 Badges

### Status Badges
```jsx
import { BADGE_CLASSES } from '@/constants/theme';

<span className={BADGE_CLASSES.green}>Approved</span>
<span className={BADGE_CLASSES.yellow}>Pending</span>
<span className={BADGE_CLASSES.red}>Rejected</span>
<span className={BADGE_CLASSES.gray}>Cancelled</span>
```

---

## ⚡ Animations (Natural Motion)

### Available Animations
```jsx
// Fade in
<div className="animate-fade-in">Content</div>

// Fade up from bottom
<div className="animate-fade-in-up">Content</div>

// Slide up
<div className="animate-slide-up">Content</div>

// Scale in from center
<div className="animate-scale-in">Content</div>

// Pulse glow (for success states)
<div className="animate-pulse-glow">Success!</div>
```

**Duration**: 200ms–250ms (smooth, soft, deliberate)

---

## 🎭 Modals

### Modal with Scale Animation
```jsx
<div className="modal-backdrop">
  <div className="modal-content">
    <div className="modal-header-gradient">
      <h2>Confirm Booking</h2>
    </div>
    <div className="p-6">
      <p>Your content here</p>
    </div>
  </div>
</div>
```

**Features**:
- Backdrop: Semi-transparent blur
- Entry: Scale + fade from center (250ms)
- Header: Nature-green gradient

---

## 📊 Progress Indicators

### Progress Bar (Booking Steps)
```jsx
<div className="progress-bar">
  <div className="bar" style={{ width: '60%' }}></div>
</div>
```

### Step Indicators (Wizard)
```jsx
<div className="step-indicator completed">1</div>
<div className="step-indicator active">2</div>
<div className="step-indicator pending">3</div>
```

**States**:
- **Active**: Green gradient with glow
- **Completed**: Solid green
- **Pending**: Gray outline

---

## 🔔 Toast Notifications

```jsx
import { TOAST_CLASSES } from '@/constants/theme';

// Success toast
<div className={TOAST_CLASSES.success}>
  ✅ Booking confirmed!
</div>

// Error toast
<div className={TOAST_CLASSES.error}>
  ❌ Something went wrong
</div>

// Info toast
<div className={TOAST_CLASSES.info}>
  ℹ️ Processing your request
</div>
```

---

## 🎯 Using Theme Constants

### Import Theme
```typescript
import { 
  COLORS, 
  BUTTON_CLASSES, 
  CARD_CLASSES,
  ANIMATION_CLASSES,
  GRADIENTS 
} from '@/constants/theme';
```

### Example Usage
```jsx
// Use predefined classes
<button className={BUTTON_CLASSES.primary}>
  Book Ground
</button>

// Use colors in inline styles
<div style={{ backgroundColor: COLORS.primary.DEFAULT }}>
  ...
</div>

// Use gradients
<div style={{ background: GRADIENTS.sport }}>
  ...
</div>

// Combine animations
<div className={`${CARD_CLASSES.interactive} ${ANIMATION_CLASSES.fadeUp}`}>
  ...
</div>
```

---

## 🎨 Tailwind Utility Classes

### Gradient Backgrounds
```jsx
<div className="bg-gradient-sport">Sport gradient</div>
<div className="bg-gradient-nature">Nature gradient</div>
<div className="bg-gradient-hero">Hero section</div>
```

### Shadows
```jsx
<div className="shadow-sport">Sport shadow</div>
<div className="shadow-glass">Glass effect shadow</div>
<div className="shadow-card">Card shadow</div>
```

### Border Radius
```jsx
<div className="rounded-sport">10px radius</div>
<div className="rounded-card">12px radius</div>
```

---

## 📱 Responsive Design

All components are fully responsive:
- Mobile-first approach
- Touch-friendly targets (min 44px)
- Optimized typography scale
- Adaptive spacing

---

## ♿ Accessibility

- **Color Contrast**: Minimum WCAG AA compliance
- **Focus States**: Visible focus rings on all interactive elements
- **Semantic HTML**: Proper heading hierarchy
- **Screen Readers**: ARIA labels where needed

---

## 🏃 Sport Icons Reference

Use emojis for sport types:
```typescript
import { SPORT_EMOJIS } from '@/constants/theme';

Football: ⚽ (SPORT_EMOJIS.football)
Cricket: 🏏 (SPORT_EMOJIS.cricket)
Basketball: 🏀 (SPORT_EMOJIS.basketball)
Badminton: 🏸 (SPORT_EMOJIS.badminton)
Tennis: 🎾 (SPORT_EMOJIS.tennis)
Volleyball: 🏐 (SPORT_EMOJIS.volleyball)
```

---

## 🎯 Design Guidelines

### DO ✅
- Use gradient buttons for primary actions
- Apply glass effects for elevated UI elements
- Use status stripes on booking cards
- Keep animations under 250ms
- Use green tones for success states

### DON'T ❌
- Use harsh neons or pure blacks
- Over-animate (avoid distraction)
- Mix conflicting gradients
- Use orange accent excessively
- Ignore semantic color meaning

---

## 🌈 Theme Summary

```typescript
{
  name: 'Sport & Nature Harmony',
  description: 'Blending sporty energy with natural calm',
  keywords: ['nature-tech', 'active-campus', 'sports-energy', 'eco-modern'],
  primaryColor: '#34D399',
  accentColor: '#2563EB',
  transitionDuration: '200ms',
  feel: 'Fresh, active, and sustainable'
}
```

---

## 📚 Resources

- **Tailwind Config**: `frontend/tailwind.config.js`
- **Global Styles**: `frontend/styles/globals.css`
- **Theme Constants**: `frontend/constants/theme.ts`
- **Font Setup**: `pages/_app.tsx` (Next.js font optimization)

---

## 🚀 Quick Start

1. **Import theme constants**:
   ```typescript
   import { BUTTON_CLASSES, COLORS } from '@/constants/theme';
   ```

2. **Use predefined CSS classes**:
   ```jsx
   <button className="btn btn-primary">Click Me</button>
   <div className="card">Content</div>
   ```

3. **Apply animations**:
   ```jsx
   <div className="animate-fade-up">Appears smoothly</div>
   ```

4. **Check consistency**:
   - All buttons should use `.btn` base class
   - All cards should use `.card` variants
   - Status colors should match booking states

---

## 💬 Overall Feel

> **CampusPlay feels like a breath of fresh air** — sporty, organized, and motivating.  
> The tone is **modern nature meets athletic energy** — where students feel the urge to play, not just book.  
> Every interaction should feel **smooth, clean, and intentional**.

---

**Made with 🌿 for Campus Sports**
