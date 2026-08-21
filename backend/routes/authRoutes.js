import express from 'express';
import { body } from 'express-validator';
import { register, login, me, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validatePassword } from '../utils/passwordValidator.js';

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').custom((value) => {
      const validation = validatePassword(value);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      return true;
    }),
    body('roll').trim().notEmpty().withMessage('Roll number is required'),
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', protect, me);
// Logout is intentionally unauthenticated so an expired token can still be cleared.
router.post('/logout', logout);

export default router;
