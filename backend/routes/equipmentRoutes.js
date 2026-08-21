import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../controllers/equipmentController.js';

const router = express.Router();

router.get('/', protect, getEquipment);
router.post('/', protect, adminOnly, createEquipment);
router.put('/:id', protect, adminOnly, updateEquipment);
router.delete('/:id', protect, adminOnly, deleteEquipment);

export default router;
