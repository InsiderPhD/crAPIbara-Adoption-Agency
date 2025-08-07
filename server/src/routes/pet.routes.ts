import { Router } from 'express';
import { petController } from '../controllers/pet.controller';

const router = Router();

// GET /api/pets
router.get('/', petController.getAllPets);

// GET /api/pets/:id
router.get('/:id', petController.getPetById);

// POST /api/pets
router.post('/', petController.createPet);

// PUT /api/pets/:id
router.put('/:id', petController.updatePet);

// DELETE /api/pets/:id
router.delete('/:id', petController.deletePet);

export default router; 