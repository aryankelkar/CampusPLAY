import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  createEquipmentBooking,
  getEquipmentBookings,
  approveEquipmentBooking,
  rejectEquipmentBooking,
  cancelEquipmentBooking,
  deleteEquipmentBooking,
} from '../controllers/equipmentController.js';

const router = express.Router();

router.get('/', protect, getEquipmentBookings);
router.post('/', protect, createEquipmentBooking);
router.put('/:id/approve', protect, adminOnly, approveEquipmentBooking);
router.put('/:id/reject', protect, adminOnly, rejectEquipmentBooking);
router.put('/:id/cancel', protect, cancelEquipmentBooking);
router.delete('/:id', protect, deleteEquipmentBooking);

export default router;
