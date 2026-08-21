# CampusPlay 🎾

**Professional sports ground booking platform for college campuses**

A full-stack web application to simplify sports ground management with booking requests, admin approvals, and real-time availability tracking.

> ✨ **Production Ready**: Fully optimized with Socket.io real-time updates, service layer architecture, and comprehensive deployment guides. See [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) for complete details.

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
# Edit .env as needed
npm install
npm run seed   # creates admin@campusplay.com / admin123
npm run dev
```
Backend runs on http://localhost:5000

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:3000

If your backend runs on a different URL, set `NEXT_PUBLIC_API_BASE` in a `.env.local` file in `frontend/`.

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
- `PATCH /api/bookings/:id/cancel` - Cancel booking (student)
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
- **[VERCEL_RENDER_DEPLOYMENT.md](./VERCEL_RENDER_DEPLOYMENT.md)** - Complete deployment guide for Vercel (frontend) + Render (backend)
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions for Render/Railway
- **[OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)** - Full optimization and refactoring details
- **[OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md)** - Previous optimization documentation
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - Quick reference guide

### Theme & Design System 🎨
- **[THEME_GUIDE.md](./THEME_GUIDE.md)** - Complete Sport & Nature Harmony theme guide
- **[THEME_IMPLEMENTATION.md](./THEME_IMPLEMENTATION.md)** - Implementation summary & technical details
- **[THEME_QUICK_REFERENCE.md](./THEME_QUICK_REFERENCE.md)** - Quick reference cheat sheet
- **[COLOR_CONTRAST_FIX.md](./COLOR_CONTRAST_FIX.md)** - Accessibility & visibility fixes
- **[NAVBAR_CONSISTENCY_FIX.md](./NAVBAR_CONSISTENCY_FIX.md)** - Navbar layout & consistency fixes
- **[IMAGE_GUIDE.md](./IMAGE_GUIDE.md)** - AI image prompts & visual assets guide
- **[VISUAL_PAGES_SUMMARY.md](./VISUAL_PAGES_SUMMARY.md)** - Enhanced pages overview
- **Theme Constants**: `frontend/constants/theme.ts`
- **Component Examples**: `frontend/components/ThemeExamples.tsx`

## 🎓 Default Credentials
**Admin Account** (created via seed script):
- Email: `admin@campusplay.com`
- Password: `admin123`

**Student Registration**:
- Must use `@vit.edu.in` email domain
- Roll format: `24XX1C00XX` (e.g., 24CS1C0001)

## 🚀 Production Deployment

> **📖 See [VERCEL_RENDER_DEPLOYMENT.md](./VERCEL_RENDER_DEPLOYMENT.md) for complete Vercel + Render deployment guide**

> **Alternative: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for Render/Railway deployment

### Quick Environment Setup

**Backend** (`.env`):
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://admin:<db_password>@campusplay-cluster.ukkoffp.mongodb.net/?appName=campusplay-cluster
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
CORS_ORIGIN=https://your-frontend-url.com
ADMIN_EMAIL=admin@vit.edu.in
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
- Test thoroughly before submitting

## 📄 License
MIT License - Feel free to use for educational purposes
