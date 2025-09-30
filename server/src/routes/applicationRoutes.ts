import express from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
import {
  createApplication,
  updateApplication
} from '../controllers/applicationController';

const router = express.Router();

router.post('/', authenticate, accessControl.authenticated, createApplication);
router.put('/:id', authenticate, accessControl.authenticated, updateApplication);

export default router; 