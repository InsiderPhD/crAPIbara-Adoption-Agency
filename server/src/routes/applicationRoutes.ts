import express from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
import {
  createApplication,
  updateApplication,
  getAllApplications
} from '../controllers/applicationController';

const router = express.Router();

router.post('/', authenticate, accessControl.authenticated, createApplication);
// Allow any authenticated user to view applications
router.get('/', authenticate, accessControl.authenticated, getAllApplications);
router.put('/:id', authenticate, accessControl.authenticated, updateApplication);

export default router; 