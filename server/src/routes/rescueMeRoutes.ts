import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  // Rescue profile management
  getRescueProfile,
  updateRescueProfile,
  uploadRescueLogo,
  
  // Pet management for rescue
  getRescuePets,
  getRescuePetById,
  createRescuePet,
  updateRescuePet,
  deleteRescuePet,
  
  // Application management for rescue
  getPetApplications,
  updateApplicationStatus,
  
  // Promotion management
  promotePet,
  
  // User management for rescue
  removeUserFromRescue,
  
  // Self delete
  deleteRescueSelf
} from '../controllers/rescueController';


const router = Router();

// All rescue routes require authentication and rescue role
router.use(authenticate, authorize('rescue'));

// Rescue profile management
router.get('/', getRescueProfile);
router.put('/', updateRescueProfile);
router.post('/logo', uploadRescueLogo);
router.delete('/', deleteRescueSelf);

// Pet management
router.get('/pets', getRescuePets);
router.get('/pets/:petId', getRescuePetById);
router.post('/pets', createRescuePet);
router.put('/pets/:petId', updateRescuePet);
router.delete('/pets/:petId', deleteRescuePet);

// Application management
router.get('/pets/:petId/applications', getPetApplications);
router.put('/applications/:applicationId', updateApplicationStatus);

// Promotion management
router.post('/pets/:petId/promote', promotePet);

// User management
router.delete('/users/:userId', removeUserFromRescue);

export default router; 