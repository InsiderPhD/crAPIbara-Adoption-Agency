import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';
import { promotePet, getUserTransactions, validateCouponCode } from '../controllers/promotionController';

const router = Router();

// Promotion routes
router.post('/pets/:petId/promote', authenticate, accessControl.rescueOnly, promotePet);
router.get('/transactions', authenticate, accessControl.authenticated, getUserTransactions);

// Coupon validation route (public)
router.get('/coupons/:couponCode/validate', validateCouponCode);

export default router; 
 