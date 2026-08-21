import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { 
  listFacilities, 
  getFacilityAvailability, 
  updateFacility 
} from '../controllers/facilityController.js';

const router = express.Router();

router.get('/', protect, listFacilities);
router.get('/availability', protect, getFacilityAvailability);
router.put('/:id', protect, adminOnly, updateFacility);

export default router;
