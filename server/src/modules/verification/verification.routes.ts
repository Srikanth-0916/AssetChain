import { Router } from 'express';
import { verificationController } from './verification.controller';
import { authenticate } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

router.use(authenticate);

// Full AI verification pipeline (admin only)
router.post('/analyze', roleGuard('admin'), (req, res, next) =>
  verificationController.analyze(req, res, next)
);

// Quick fraud check
router.post('/fraud-check', roleGuard('admin'), (req, res, next) =>
  verificationController.fraudCheck(req, res, next)
);

export default router;
