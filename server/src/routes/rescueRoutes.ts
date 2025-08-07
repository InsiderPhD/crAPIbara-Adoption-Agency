import { Router } from 'express';
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

// GET /api/v1/rescues
router.get('/', listRescues);

// GET /api/v1/rescues/:id
router.get('/:id', getRescue);

// POST /api/v1/rescues
router.post('/', createRescue);

// PUT /api/v1/rescues/:id
router.put('/:id', updateRescue);

// GET /api/v1/rescues/users/available
router.get('/users/available', getAllUsersForRescue);

// POST /api/v1/rescues/:rescueId/users/:userId
router.post('/:rescueId/users/:userId', addUserToRescue);

// DELETE /api/v1/rescues/:id
router.delete('/:id', deleteRescue);

export default router; 