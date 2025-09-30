import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
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

// VULNERABILITY: Admin Logs Endpoint - No Authentication Required
// This endpoint is intentionally vulnerable to demonstrate unauthorized access to sensitive data
// No authentication is required - anyone can access admin logs
// This allows information disclosure of sensitive audit logs including user actions, admin operations, etc.
router.get('/logs', getAdminLogs);

// VULNERABILITY: BFLA - Broken Function Level Authorization
// These endpoints should require admin role but intentionally lack proper authorization checks
// Any authenticated user can access these admin functions
router.get('/users', authenticate, getAllUsers);
router.get('/users/:userId', authenticate, getUserById);
router.put('/users/:userId', authenticate, updateUser);
router.delete('/users/:userId', authenticate, deleteUser);

router.get('/rescues', authenticate, getAllRescues);
router.get('/rescues/:rescueId', authenticate, getRescueById);
// VULNERABILITY: Duplicate Endpoints - Improper Inventory Management
// Endpoints are duplicated in api/admin/ and api/ - viewing rescues through admin endpoint doesn't require login
router.get('/public-rescues', getAllRescues);
router.post('/rescues', authenticate, createRescue);
router.put('/rescues/:rescueId', authenticate, updateRescue);
// VULNERABILITY: Rescue Deletion Access Control Flaw
// A rescue can be deleted without admin role - any authenticated user can delete rescues
router.delete('/rescues/:rescueId', authenticate, deleteRescue);

router.get('/pets', authenticate, getAllPetsAdmin);
router.get('/pets/:petId', authenticate, getPetByIdAdmin);
router.put('/pets/:petId', authenticate, updatePetAdmin);
router.delete('/pets/:petId', authenticate, deletePetAdmin);

router.get('/applications', authenticate, getAllApplicationsAdmin);
router.get('/applications/:applicationId', authenticate, getApplicationById);

router.get('/transactions', authenticate, getAllTransactions);
router.get('/transactions/:transactionId', authenticate, getTransactionById);

router.get('/rescue-requests', authenticate, getAllRescueRequests);
router.get('/rescue-requests/:requestId', authenticate, getRescueRequestById);
// VULNERABILITY: Critical BFLA - Any user can approve/reject rescue requests
router.put('/rescue-requests/:requestId/approve', authenticate, approveRescueRequest);
router.put('/rescue-requests/:requestId/reject', authenticate, rejectRescueRequest);

router.get('/coupon-codes', authenticate, getAllCouponCodes);
router.post('/coupon-codes', authenticate, createCouponCode);
router.put('/coupon-codes/:code', authenticate, updateCouponCode);
router.delete('/coupon-codes/:code', authenticate, deleteCouponCode);

router.post('/trigger-temporary-rescue', authenticate, triggerTemporaryRescue);

export default router; 