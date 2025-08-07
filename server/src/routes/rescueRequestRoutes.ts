import express from 'express';
import { authenticate } from '../middleware/auth';
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
router.post('/', authenticate, createRescueRequest);

// Get a specific rescue request
router.get('/:id', authenticate, getRescueRequest);

// Get all rescue requests for the current user
router.get('/user/me', authenticate, getUserRescueRequests);

// Get all rescue requests (admin only)
router.get('/', authenticate, getAllRescueRequests);

// Update rescue request status (admin only)
router.patch('/:id/status', authenticate, updateRescueRequestStatus);

// Update rescue request payment (admin only)
router.patch('/:id/payment', authenticate, updateRescueRequestPayment);

// Delete a rescue request
router.delete('/:id', authenticate, deleteRescueRequest);

export default router; 