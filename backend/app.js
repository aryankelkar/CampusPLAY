import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * Builds the Express application. Kept separate from server.js so tests can
 * mount the app without opening a port or a Socket.io server.
 */
export const createApp = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const app = express();

  // Behind a reverse proxy (Render/Railway/nginx) the client IP comes from
  // X-Forwarded-For; rate limiting needs it. Opt-in via TRUST_PROXY.
  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  }

  app.use(helmet());
  if (!isProduction && process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/user', userRoutes);

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
