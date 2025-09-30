import express from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
import {
  createRescueRequest,
  getRescueRequest,
  getUserRescueRequests,
  getAllRescueRequests,
  updateRescueRequestStatus,
  updateRescueRequestPayment,
  deleteRescueRequest
} from '../controllers/rescueRequestController';

const router = express.Router();

// Create a new rescue request
router.post('/', authenticate, accessControl.authenticated, createRescueRequest);

// Get a specific rescue request
router.get('/:id', authenticate, accessControl.authenticated, getRescueRequest);

// Get all rescue requests for the current user
router.get('/user/me', authenticate, accessControl.authenticated, getUserRescueRequests);

// Get all rescue requests (admin only)
router.get('/', authenticate, accessControl.adminOnly, getAllRescueRequests);

// Update rescue request status (admin only)
router.patch('/:id/status', authenticate, accessControl.adminOnly, updateRescueRequestStatus);

// Update rescue request payment (admin only)
router.patch('/:id/payment', authenticate, accessControl.adminOnly, updateRescueRequestPayment);

// Delete a rescue request
router.delete('/:id', authenticate, accessControl.authenticated, deleteRescueRequest);

export default router; 