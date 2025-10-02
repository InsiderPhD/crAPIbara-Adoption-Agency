import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} from '../controllers/petController';

const router = Router();

// Public routes (no authentication required)
router.get('/', getAllPets);
router.get('/:id', getPetById);

// Admin or rescue routes
router.post('/', authenticate, accessControl.rescueOrOwnRescue, createPet);
// Allow anyone to update pet details (no authentication)
router.put('/:id', updatePet);
router.delete('/:id', authenticate, accessControl.rescueOrOwnRescue, deletePet);

// VULNERABILITY: Pet Creation/Modification Access Control Flaw
// Any rescue can create pets, but pets can only be modified by the rescue that owns them
// However, the ownership check is flawed - any rescue can modify any pet
router.post('/rescue', authenticate, accessControl.rescueOnly, createPet);
router.put('/rescue/:id', authenticate, accessControl.rescueOnly, updatePet);

// VULNERABILITY: Missing Rate Limiting - Pet application endpoint lacks rate limiting
// This endpoint allows users to apply for pets but has no rate limiting implemented
// Despite documentation implying rate limiting exists, this allows application spam
router.post('/:petId/apply', authenticate, accessControl.authenticated, createPet);

export default router; 