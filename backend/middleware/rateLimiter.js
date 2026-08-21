import rateLimit from 'express-rate-limit';

/**
 * Stricter limiter for credential endpoints (login / register) to slow down
 * brute-force, credential stuffing and registration abuse.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Read lazily so deployments (and tests) can tune the limit via env.
  limit: () => Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again in 15 minutes.',
  },
});
