# CampusPlay

Full-stack web app to digitize college sports access and management.

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

If your backend runs on a different URL, set NEXT_PUBLIC_API_BASE in a `.env.local` file in `frontend/`.

## Features
- Student register/login
- Submit booking requests with game, ground, date, time
- View own booking status
- Admin dashboard to approve/reject bookings

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- GET /api/bookings
- POST /api/bookings
- PATCH /api/bookings/:id/approve
- PATCH /api/bookings/:id/reject

## Notes
- JWT stored in HttpOnly cookie `token`
- CORS configured for http://localhost:3000 with credentials
- Basic validation using express-validator
