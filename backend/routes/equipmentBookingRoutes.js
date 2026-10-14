import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  createEquipmentBooking,
  getEquipmentBookings,
  approveEquipmentBooking,
  rejectEquipmentBooking,
  cancelEquipmentBooking,
  deleteEquipmentBooking,
  markEquipmentAsReady,
  markEquipmentAsIssued,
  requestEquipmentReturn,
  confirmEquipmentReturn,
  getEquipmentInventoryTransactions,
} from '../controllers/equipmentController.js';

const router = express.Router();

router.get('/', protect, getEquipmentBookings);
router.get('/transactions', protect, adminOnly, getEquipmentInventoryTransactions);
router.post('/', protect, createEquipmentBooking);
router.put('/:id/approve', protect, adminOnly, approveEquipmentBooking);
router.put('/:id/ready', protect, adminOnly, markEquipmentAsReady);
router.put('/:id/issue', protect, adminOnly, markEquipmentAsIssued);
router.put('/:id/request-return', protect, requestEquipmentReturn);
router.put('/:id/return-request', protect, requestEquipmentReturn);
router.put('/:id/confirm-return', protect, adminOnly, confirmEquipmentReturn);
router.put('/:id/reject', protect, adminOnly, rejectEquipmentBooking);
router.put('/:id/cancel', protect, cancelEquipmentBooking);
router.delete('/:id', protect, deleteEquipmentBooking);

export default router;
