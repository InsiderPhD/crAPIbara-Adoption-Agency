import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updateProfileVulnerable,
  requestPasswordReset,
  resetPassword,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authenticate, accessControl.authenticated, getProfile);
router.put('/profile', authenticate, accessControl.authenticated, updateProfile);

// VULNERABILITY: IDOR - Intentionally broken path using userId in URL without proper authorization checks
// This allows users to access/modify other users' profiles by changing the userId in the URL
router.put('/:userId', authenticate, accessControl.authenticated, updateProfile);

// VULNERABILITY: Mass Assignment - Users can change their password and role via parameters
// This endpoint allows users to modify restricted fields like role and password without proper validation
router.put('/profile/vulnerable', authenticate, accessControl.authenticated, updateProfileVulnerable);

export default router; 