import express from 'express';
import { register, login, requestPasswordReset, resetPassword } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router; 