import { Router } from 'express';
import { recommendationController } from './recommendation.controller';
import { authenticate } from '../../middleware/auth';
import { aiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/investment', authenticate, aiRateLimiter, (req, res, next) =>
  recommendationController.getRecommendation(req, res, next)
);

export default router;
