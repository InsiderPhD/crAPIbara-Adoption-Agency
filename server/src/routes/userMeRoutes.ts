import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUserProfile,
  updateUserProfile,
  getUserApplications,
  requestRescueUpgrade,
  checkRescuePromotion
} from '../controllers/userController';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// User profile management
router.get('/me', getUserProfile);
router.put('/me', updateUserProfile);

// User applications
router.get('/me/applications', getUserApplications);

// Rescue upgrade request
router.post('/me/request-rescue-upgrade', requestRescueUpgrade);

// Check rescue promotion status
router.get('/me/rescue-promotion', checkRescuePromotion);

export default router; 