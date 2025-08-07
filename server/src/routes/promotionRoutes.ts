import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { promotePet, getUserTransactions, validateCouponCode } from '../controllers/promotionController';

const router = Router();

// Promotion routes
router.post('/pets/:petId/promote', authenticate, authorize('rescue'), promotePet);
router.get('/transactions', authenticate, getUserTransactions);

// Coupon validation route (public)
router.get('/coupons/:couponCode/validate', validateCouponCode);

export default router; 
 