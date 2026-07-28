import { Router } from 'express';
import { complianceController } from './compliance.controller';
import { authenticate, authorizeRole } from '../../middleware/auth';

const router = Router();

router.get('/profile/:id', complianceController.getProfile);
router.post('/whitelist', authenticate, authorizeRole('admin'), complianceController.updateProfile);
router.put('/profile/:id', authenticate, authorizeRole('admin'), complianceController.updateProfile);

export default router;
