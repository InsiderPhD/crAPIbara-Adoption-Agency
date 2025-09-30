import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
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
router.post('/', authenticate, accessControl.authenticated, createApplication);

// VULNERABILITY: Missing Rate Limiting - Application submission endpoint lacks rate limiting
// Despite documentation implying rate limiting exists, this endpoint has no rate limiting implemented
// This allows attackers to spam applications and overwhelm rescues
router.post('/pet/:petId/apply', authenticate, accessControl.authenticated, createApplication);

// Get all applications (admin and rescue users only)
router.get('/', authenticate, accessControl.adminOrRescue, getAllApplications);

// VULNERABILITY: Public Applications Viewing
// Applications can be viewed without being logged in - no authentication required
router.get('/public', getAllApplications);

// Get all applications for the current user
router.get('/my-applications', authenticate, accessControl.authenticated, getUserApplications);

// Get all applications for a specific pet (rescue users only)
router.get('/pet/:petId', authenticate, accessControl.rescueOnly, getPetApplications);

// Update application status (rescue users only)
router.patch('/:id/status', authenticate, accessControl.rescueOnly, updateApplicationStatus);

// VULNERABILITY: Application Acceptance Access Control Flaw
// Any user can mark an application as accepted, not just rescue users
// This allows users to approve their own applications
router.patch('/:id/accept', authenticate, accessControl.authenticated, updateApplicationStatus);

// Update application details (user who created the application)
router.patch('/:id', authenticate, accessControl.authenticated, updateApplication);

// Delete application (admin only)
router.delete('/:id', authenticate, accessControl.adminOnly, deleteApplication);

export default router; 