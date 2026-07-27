import { Router } from 'express';
import { portfolioController } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, portfolioController.getPortfolio);

export default router;
