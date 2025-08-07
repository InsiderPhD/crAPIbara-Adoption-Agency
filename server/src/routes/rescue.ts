import { Router } from 'express';
import {
  createRescue,
  getRescue,
  updateRescue,
  deleteRescue,
  listRescues,
} from '../controllers/rescue';
import { validateRequest } from '../middleware/validateRequest';
import { createRescueSchema, updateRescueSchema } from '../validations/rescue';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', listRescues);
router.get('/:id', getRescue);

// Protected routes
router.post(
  '/',
  authenticate,
  validateRequest({ body: createRescueSchema }),
  createRescue
);

router.patch(
  '/:id',
  authenticate,
  validateRequest({ body: updateRescueSchema }),
  updateRescue
);

router.delete('/:id', authenticate, deleteRescue);

export default router; 