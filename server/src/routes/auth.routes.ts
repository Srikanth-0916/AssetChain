import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  walletNonceSchema,
  walletVerifySchema,
} from '../utils/validators';

const router = Router();

// ─── Public Auth Routes ───
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ─── Authenticated Auth Routes ───
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

// ─── Wallet Routes ───
router.post(
  '/wallet/nonce',
  authenticate,
  validate(walletNonceSchema),
  authController.walletNonce
);

router.post(
  '/wallet/verify',
  authenticate,
  validate(walletVerifySchema),
  authController.walletVerify
);

export default router;
