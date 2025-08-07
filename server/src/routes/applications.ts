import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createApplication,
  getUserApplications,
  getPetApplications,
  updateApplicationStatus,
  updateApplication,
  getAllApplications,
  deleteApplication
} from '../controllers/applicationController';

const router = Router();

// Create a new application
router.post('/', authenticate, createApplication);

// Get all applications (admin and rescue users only)
router.get('/', authenticate, getAllApplications);

// Get all applications for the current user
router.get('/my-applications', authenticate, getUserApplications);

// Get all applications for a specific pet (rescue users only)
router.get('/pet/:petId', authenticate, getPetApplications);

// Update application status (rescue users only)
router.patch('/:id/status', authenticate, updateApplicationStatus);

// Update application details (user who created the application)
router.patch('/:id', authenticate, updateApplication);

// Delete application (admin only)
router.delete('/:id', authenticate, deleteApplication);

export default router; 