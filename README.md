# CampusPlay 🎾

**Professional sports ground booking platform for college campuses**

A full-stack web application to simplify sports ground management with booking requests, admin approvals, and real-time availability tracking.

> Status: **Ready for student/demo deployment.** Automated coverage exists for authentication, authorization, booking conflicts and Socket.io auth, but the app has not been load-tested or security-reviewed by a third party. See [Known limitations](#-known-limitations).

## 🚀 Tech Stack
- **Frontend**: Next.js 14 (TypeScript) + Tailwind CSS + Socket.io-client
- **Backend**: Node.js + Express.js + Mongoose + Socket.io
- **Database**: MongoDB (Atlas ready)
- **Auth**: JWT in HttpOnly cookies
- **Real-time**: Socket.io for live updates
- **Fonts**: Next.js Font Optimization (Inter & Poppins)

## Prerequisites
- Node.js 18+
- MongoDB running locally or a connection string

## Setup

### 1) Backend
```bash
cd backend
cp .env.example .env
# Set MONGO_URI and a strong JWT_SECRET (openssl rand -base64 48)
npm install
npm run seed   # provisions the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```
Backend runs on http://localhost:5000

Run the backend test suite with `npm test` (uses an in-memory MongoDB, no external services needed).

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:3000

If your backend runs on a different URL, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`. It is the backend **origin** only: REST calls derive `${NEXT_PUBLIC_API_URL}/api` and Socket.io connects to the origin itself, so never append `/api`.

## ✨ Features

### For Students
- 🔐 Register/Login with college email (@vit.edu.in)
- 🎯 Multi-step booking wizard with visual feedback
- ✅ Pre-submission review modal to confirm all details
- 📅 View upcoming and past bookings
- 📊 Booking history grouped by month
- ⚙️ Profile settings and password management
- 📱 Fully responsive mobile design
- ⚡ **Real-time status updates** - See booking approvals instantly

### For Admins
- 📋 Unified dashboard with all booking requests
- 🔍 Filter by status, game, and search
- ✅ Approve/Reject bookings with confirmation
- 🔄 Revoke decisions (move back to pending)
- 📝 Audit trail for status changes
- 🎨 Interactive summary cards with counters
- ⚡ **Real-time notifications** - New bookings appear instantly
- 🔒 Conflict detection before approval

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Bookings
- `GET /api/bookings` - List bookings (filtered by user role)
- `POST /api/bookings` - Create booking request
- `PATCH /api/bookings/:id/approve` - Approve booking (admin)
- `PATCH /api/bookings/:id/reject` - Reject booking (admin)
- `PATCH /api/bookings/:id/pending` - Move to pending (admin)
- `PATCH /api/bookings/:id/cancel` (or `POST .../cancel`) - Cancel booking (student, status transition only; history is kept)
- `GET /api/bookings/availability` - Check slot availability

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/update` - Update profile
- `POST /api/user/change-password` - Change password

## 📝 Technical Notes

### Architecture
- **Backend**: RESTful API with Express.js + Service Layer
- **Frontend**: Server-side rendered Next.js app with Socket.io
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT stored in HttpOnly cookies
- **Real-time**: Socket.io with room-based broadcasting
- **Validation**: express-validator + client-side checks
- **Styling**: Tailwind CSS with custom design system
- **Animations**: framer-motion for smooth transitions
- **Fonts**: Optimized with next/font (Inter & Poppins)

### Code Organization
- **Services**: Business logic layer (`backend/services/`)
- **Constants**: Centralized configuration in `constants/` folders
- **Utilities**: Reusable helpers in `utils/` folders
- **Components**: Modular React components
- **Context**: Socket.io and Auth providers
- **Type Safety**: TypeScript for frontend

### Design System - Sport & Nature Harmony Theme 🎨
- **Theme**: Modern UI blending sporty energy with natural calm
- **Colors**: Primary Green (#34D399), Accent Blue (#2563EB), Support Orange (#F97316)
- **Typography**: Poppins (headings, 600-700) + Inter (body, 400-500)
- **Buttons**: Gradient sport buttons with glow shadows
- **Cards**: Glass morphism with status stripes (green/amber/red)
- **Navbar**: Floating semi-transparent with gradient underlines
- **Animations**: Natural motion (200-250ms, ease-out)
- **Effects**: Glassmorphism, gradient text, smooth transitions
- **See**: [THEME_GUIDE.md](./THEME_GUIDE.md) for complete theme documentation

## 📚 Documentation

### Deployment & Optimization
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions for Render/Railway
- **[docs/archive/](./docs/archive)** - Historical fix/optimization notes kept for reference

### Theme & Design System 🎨
- **[THEME_GUIDE.md](./THEME_GUIDE.md)** - Complete Sport & Nature Harmony theme guide
- **Theme Constants**: `frontend/constants/theme.ts`
- **Component Examples**: `frontend/components/ThemeExamples.tsx`

## 🔐 Admin provisioning

Admins are **never** created by public registration — registering always yields `role = student`,
whatever email is used. The single admin account is provisioned out-of-band:

```bash
cd backend
# set ADMIN_EMAIL and ADMIN_PASSWORD in .env first (ADMIN_PASSWORD is mandatory when NODE_ENV=production)
npm run seed
```

In development, if `ADMIN_PASSWORD` is unset the seed script generates a random development-only
password and prints it once. No credential is hard-coded in the repository.

**Student registration**: must use an `@vit.edu.in` email; password needs 8+ characters with an
uppercase letter, a lowercase letter and a digit.

## 🛡️ Security notes

- JWT is stored in an HttpOnly cookie; `secure` + `SameSite=None` in production.
- Socket.io handshakes are authenticated from that same cookie. The server derives the user and
  role from the verified JWT and joins `admin-room` or `student-{id}` itself — clients cannot pick
  a room, impersonate another student, or claim to be an admin.
- `POST /api/auth/login` and `/register` are rate limited (`AUTH_RATE_LIMIT_MAX`, default 10 per
  15 minutes per IP). Behind a proxy set `TRUST_PROXY=1` so the real client IP is used.
- Authorization is enforced entirely in the backend; frontend role checks only hide UI.
- Errors go through a central handler: validation, duplicate-key and auth errors get proper status
  codes, and stack traces/Mongo internals are never returned in production.

## 🗓️ Booking rules

A booking is **active** (occupies its slot) when its status is `Pending` or `Approved`.
`Rejected` and `Cancelled` bookings free the slot again. The same rule drives creation, approval,
revocation and the availability endpoint, and it is backed by a partial unique index
(`unique_active_slot` on `{ground, date, time}` filtered to active statuses) so two concurrent
requests for one slot can never both succeed — the loser gets HTTP 409.

> Upgrading an existing database: an older index named `unique_active_booking_per_slot` included
> `status` in the key, which allowed a Pending and an Approved booking on the same slot. Drop it
> once (`db.bookings.dropIndex('unique_active_booking_per_slot')`); Mongoose creates the corrected
> index automatically.

## ⚠️ Known limitations

- No email verification or password reset flow.
- Rate limiting is in-memory, so it resets on restart and is per-instance.
- No end-to-end/browser tests; frontend logic is covered only indirectly.
- Historical, point-in-time design/fix notes live in [`docs/archive/`](./docs/archive) and may be
  out of date.

## 🚀 Production Deployment

> **📖 See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete step-by-step deployment instructions**

### Quick Environment Setup

**Backend** (`.env`):
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campusplay
JWT_SECRET=<openssl rand -base64 48>
CORS_ORIGIN=https://your-frontend-url.com
TRUST_PROXY=1
ADMIN_EMAIL=admin@vit.edu.in
ADMIN_PASSWORD=<strong password, used by the seed script only>
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Build Commands
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run build
npm start
```

### Deployment Platforms
- **Backend**: Render, Railway, Heroku
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas

### Health Check
```bash
curl https://your-backend-url.com/api/health
# Should return: {"status":"ok"}
```

## 🤝 Contributing
Contributions are welcome! Please ensure:
- Code follows existing patterns
- Use shared constants from `constants/` folders
- Add TypeScript types where applicable
- `cd backend && npm test` and `cd frontend && npm run lint && npm run build` pass (CI enforces both)

## 📄 License
MIT License - Feel free to use for educational purposes
