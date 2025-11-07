# CampusPlay 🎾

**Professional sports ground booking platform for college campuses**

A full-stack web application to simplify sports ground management with booking requests, admin approvals, and real-time availability tracking.

> ✨ **Recently Optimized**: Code refactored for production readiness with centralized constants, reusable utilities, and consistent UI/UX. See [OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md) for details.

## Tech Stack
- Frontend: Next.js (TypeScript) + Tailwind CSS
- Backend: Node.js + Express.js + Mongoose
- Database: MongoDB
- Auth: JWT in HttpOnly cookies

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

### For Admins
- 📋 Unified dashboard with all booking requests
- 🔍 Filter by status, game, and search
- ✅ Approve/Reject bookings with confirmation
- 🔄 Revoke decisions (move back to pending)
- 📝 Audit trail for status changes
- 🎨 Interactive summary cards with counters

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
- **Backend**: RESTful API with Express.js
- **Frontend**: Server-side rendered Next.js app
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT stored in HttpOnly cookies
- **Validation**: express-validator + client-side checks
- **Styling**: Tailwind CSS with custom design system
- **Animations**: framer-motion for smooth transitions

### Code Organization
- **Constants**: Centralized configuration in `constants/` folders
- **Utilities**: Reusable helpers in `utils/` folders
- **Components**: Modular React components
- **Type Safety**: TypeScript for frontend

### Design System
- Colors: Blue primary, green success, red error
- Status badges: Consistent across all views
- Spacing: Uniform padding/margins
- Shadows: Consistent card elevations

## 📚 Documentation
- [OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md) - Detailed refactoring documentation
- [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) - Quick reference guide

## 🎓 Default Credentials
**Admin Account** (created via seed script):
- Email: `admin@campusplay.com`
- Password: `admin123`

**Student Registration**:
- Must use `@vit.edu.in` email domain
- Roll format: `24XX1C00XX` (e.g., 24CS1C0001)

## 🚀 Production Deployment

### Environment Variables
**Backend** (`.env`):
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
CORS_ORIGIN=https://your-frontend-url.com
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_BASE=https://your-api-url.com/api
```

### Build Commands
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build && npm start
```

## 🤝 Contributing
Contributions are welcome! Please ensure:
- Code follows existing patterns
- Use shared constants from `constants/` folders
- Add TypeScript types where applicable
- Test thoroughly before submitting

## 📄 License
MIT License - Feel free to use for educational purposes
