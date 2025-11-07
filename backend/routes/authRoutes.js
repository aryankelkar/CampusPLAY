import express from 'express';
import { body } from 'express-validator';
import { register, login, me, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('roll').custom((value, { req }) => {
      if (req.body.email !== 'admin@campusplay.com' && (!value || String(value).trim() === '')) {
        throw new Error('Roll number is required');
      }
      return true;
    }),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', protect, me);
router.post('/logout', protect, logout);

export default router;
