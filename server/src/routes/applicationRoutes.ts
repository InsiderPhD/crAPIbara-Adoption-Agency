import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createApplication,
  updateApplication
} from '../controllers/applicationController';

const router = express.Router();

router.post('/', authenticate, createApplication);
router.put('/:id', authenticate, updateApplication);

export default router; 