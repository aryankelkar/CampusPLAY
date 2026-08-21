import express from 'express';
import { body } from 'express-validator';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getBookings, createBooking, approveBooking, rejectBooking, availability, setPending, cancelBooking, deleteBooking } from '../controllers/bookingController.js';

const router = express.Router();

router.get('/', protect, getBookings);
router.post(
  '/',
  protect,
  [
    body('game').notEmpty().withMessage('Game is required'),
    body('ground').notEmpty().withMessage('Ground is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('timeSlots').isArray({ min: 1 }).withMessage('At least one time slot is required'),
  ],
  createBooking
);

router.patch('/:id/approve', protect, adminOnly, approveBooking);
router.patch('/:id/reject', protect, adminOnly, rejectBooking);
router.patch('/:id/pending', protect, adminOnly, setPending);
router.patch('/:id/cancel', protect, cancelBooking);

// Delete route - students can delete Rejected/Cancelled, admins can delete any
router.delete('/:id', protect, deleteBooking);

// Availability for a given date and ground
router.get('/availability', protect, availability);

export default router;
