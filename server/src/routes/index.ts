import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Health check
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
