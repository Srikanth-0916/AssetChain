import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

router.use(authenticate);
router.use(roleGuard('admin'));

router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));

export default router;
