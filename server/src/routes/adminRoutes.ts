import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  // User management
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  
  // Rescue management
  getAllRescues,
  getRescueById,
  createRescue,
  updateRescue,
  deleteRescue,
  
  // Pet management
  getAllPetsAdmin,
  getPetByIdAdmin,
  updatePetAdmin,
  deletePetAdmin,
  
  // Application management
  getAllApplicationsAdmin,
  getApplicationById,
  
  // Transaction management
  getAllTransactions,
  getTransactionById,
  
  // Rescue request management
  getAllRescueRequests,
  getRescueRequestById,
  approveRescueRequest,
  rejectRescueRequest,
  
  // Coupon code management
  getAllCouponCodes,
  createCouponCode,
  updateCouponCode,
  deleteCouponCode,
  
  // Logs
  getAdminLogs,
  
  // Testing
  triggerTemporaryRescue,
  forceProcessScheduler
} from '../controllers/adminController';

const router = Router();

// VULNERABILITY: Admin Logs Endpoint - No Role-Based Authorization
// This endpoint is intentionally vulnerable to demonstrate unauthorized access to sensitive data
// Any authenticated user, regardless of their role, can access admin logs
// This allows information disclosure of sensitive audit logs including user actions, admin operations, etc.
router.get('/logs', authenticate, getAdminLogs);

// Public testing endpoint (no authentication required)
router.post('/force-process-scheduler', forceProcessScheduler);

// All other admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// Rescue management
router.get('/rescues', getAllRescues);
router.get('/rescues/:rescueId', getRescueById);
router.post('/rescues', createRescue);
router.put('/rescues/:rescueId', updateRescue);
router.delete('/rescues/:rescueId', deleteRescue);

// Pet management
router.get('/pets', getAllPetsAdmin);
router.get('/pets/:petId', getPetByIdAdmin);
router.put('/pets/:petId', updatePetAdmin);
router.delete('/pets/:petId', deletePetAdmin);

// Application management
router.get('/applications', getAllApplicationsAdmin);
router.get('/applications/:applicationId', getApplicationById);

// Transaction management
router.get('/transactions', getAllTransactions);
router.get('/transactions/:transactionId', getTransactionById);

// Rescue request management
router.get('/rescue-requests', getAllRescueRequests);
router.get('/rescue-requests/:requestId', getRescueRequestById);
router.put('/rescue-requests/:requestId/approve', approveRescueRequest);
router.put('/rescue-requests/:requestId/reject', rejectRescueRequest);

// Coupon code management
router.get('/coupon-codes', getAllCouponCodes);
router.post('/coupon-codes', createCouponCode);
router.put('/coupon-codes/:code', updateCouponCode);
router.delete('/coupon-codes/:code', deleteCouponCode);

// Testing (admin only)
router.post('/trigger-temporary-rescue', triggerTemporaryRescue);

export default router; 