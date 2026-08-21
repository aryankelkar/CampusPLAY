import express from 'express';
import { body } from 'express-validator';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getBookings, createBooking, approveBooking, rejectBooking, availability, setPending, cancelBooking } from '../controllers/bookingController.js';

const router = express.Router();

router.get('/', protect, getBookings);
router.post(
  '/',
  protect,
  [
    body('game').notEmpty().withMessage('Game is required'),
    body('ground').notEmpty().withMessage('Ground is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
  ],
  createBooking
);

router.patch('/:id/approve', protect, adminOnly, approveBooking);
router.patch('/:id/reject', protect, adminOnly, rejectBooking);
router.patch('/:id/pending', protect, adminOnly, setPending);
// Cancelling is a status transition, not a deletion: booking history is kept.
router.patch('/:id/cancel', protect, cancelBooking);
router.post('/:id/cancel', protect, cancelBooking);

// Availability for a given date and ground
router.get('/availability', protect, availability);

export default router;
