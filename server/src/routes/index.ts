import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import assetRoutes from './asset.routes';
import marketplaceRoutes from './marketplace.routes';
import daoRoutes from './dao.routes';
import portfolioRoutes from './portfolio.routes';

const router = Router();

// Mount API Route Modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/assets', assetRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/dao', daoRoutes);
router.use('/portfolio', portfolioRoutes);

// Health Check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
