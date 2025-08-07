import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} from '../controllers/petController';

const router = Router();

// GET /api/v1/pets - Get all pets
router.get('/', getAllPets);

// GET /api/v1/pets/:id - Get a single pet by ID
router.get('/:id', getPetById);

// POST /api/v1/pets - Create a new pet
router.post('/', authenticate, authorize('admin', 'rescue'), createPet);

// PUT /api/v1/pets/:id - Update a pet
router.put('/:id', authenticate, authorize('admin', 'rescue'), updatePet);

// DELETE /api/v1/pets/:id - Delete a pet
router.delete('/:id', authenticate, authorize('admin', 'rescue'), deletePet);

export default router; 