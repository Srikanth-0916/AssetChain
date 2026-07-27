import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validator';
import { updateProfileSchema, kycActionSchema, suspendUserSchema } from '../utils/validators';

const router = Router();

// ─── Authenticated User Routes ───
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.post('/me/kyc', authenticate, userController.submitKYC);

// ─── Admin Routes ───
router.get('/', authenticate, roleGuard('admin'), userController.getUsers);
router.patch('/:id/kyc', authenticate, roleGuard('admin'), validate(kycActionSchema), userController.reviewKYC);
router.patch('/:id/suspend', authenticate, roleGuard('admin'), validate(suspendUserSchema), userController.suspendUser);

export default router;
