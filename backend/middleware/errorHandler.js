import { ERROR_MESSAGES } from '../constants/index.js';

/**
 * Centralized error handler.
 * Maps known error shapes (Mongoose validation/cast, duplicate keys, JWT) to
 * safe client messages and never leaks stack traces or driver internals in
 * production.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  let status = err.status || err.statusCode || 500;
  let message = err.message || ERROR_MESSAGES.SERVER_ERROR;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ') || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = err.keyPattern?.ground
      ? ERROR_MESSAGES.SLOT_TAKEN_RACE
      : 'Duplicate value: this record already exists';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Not authorized, token failed';
  }

  if (status >= 500) {
    console.error('❌ Error:', err);
    if (isProduction) message = ERROR_MESSAGES.SERVER_ERROR;
  }

  res.status(status).json({
    success: false,
    message,
    ...(!isProduction && status >= 500 && err.stack ? { stack: err.stack } : {}),
  });
};
