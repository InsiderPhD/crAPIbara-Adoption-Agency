import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
import {
  listRescues,
  getRescue,
  createRescue,
  updateRescue,
  deleteRescue,
  getAllUsersForRescue,
  addUserToRescue,
} from '../controllers/rescue';

const router = Router();

// Public routes (no authentication required)
router.get('/', listRescues);
router.get('/:id', getRescue);

// Admin-only routes
router.post('/', authenticate, accessControl.adminOnly, createRescue);
router.put('/:id', authenticate, accessControl.adminOnly, updateRescue);
router.delete('/:id', authenticate, accessControl.adminOnly, deleteRescue);

// VULNERABILITY: IDOR - Intentionally broken path using rescueId in URL without proper ownership checks
// This allows rescue users to access/modify other rescues' profiles by changing the rescueId in the URL
router.put('/:rescueId', authenticate, accessControl.rescueOnly, updateRescue);

// Admin-only user management
router.get('/users/available', authenticate, accessControl.adminOnly, getAllUsersForRescue);
router.post('/:rescueId/users/:userId', authenticate, accessControl.adminOnly, addUserToRescue);

export default router; 