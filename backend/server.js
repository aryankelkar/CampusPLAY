import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import equipmentBookingRoutes from './routes/equipmentBookingRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import { seedDefaultFacilities } from './services/facilityService.js';
import { initializeSocket } from './services/socketService.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('💡 Please check your .env file');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

const app = express();
const httpServer = createServer(app);

// Allowed origins for CORS
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim().replace(/\/$/, ''))
  : [];

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'https://campusplay-frontend.vercel.app',
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins])).filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!isProduction) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

initializeSocket(io);

// DB
connectDB().then(() => {
  seedDefaultFacilities();
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
  frameguard: false,
}));
if (!isProduction) {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/bookings', bookingRoutes);
app.use('/api/user', userRoutes);
app.use('/user', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/api/equipment-bookings', equipmentBookingRoutes);
app.use('/equipment-bookings', equipmentBookingRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/facilities', facilityRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/timetables', timetableRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Root route (friendly message)
app.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>CampusPlay API</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; color: #0f172a; }
          .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; max-width: 520px; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>CampusPlay API</h1>
          <p>The API server is running.</p>
          <p>Health check: <a href="/api/health">/api/health</a></p>
          <p>Frontend runs at <code> http://localhost:3000 </code></p>
        </div>
      </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  if (isDevelopment) {
    console.error('❌ Error:', err);
  }
  const status = err.status || 500;
  res.status(status).json({ 
    success: false,
    message: err.message || 'Server error',
    ...(isDevelopment && err.stack && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
