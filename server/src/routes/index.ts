import { Router, Request } from 'express';
import { env } from '../config/env';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import assetRoutes from './asset.routes';
import marketplaceRoutes from './marketplace.routes';
import daoRoutes from './dao.routes';
import portfolioRoutes from './portfolio.routes';
import aiRoutes from '../modules/ai/ai.routes';
import verificationRoutes from '../modules/verification/verification.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import approvalRoutes from '../modules/approval/approval.routes';
import indexerRoutes from '../modules/indexer/indexer.routes';

const router = Router();

// ─── V1 Core Modules ──────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/assets', assetRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/dao', daoRoutes);
router.use('/portfolio', portfolioRoutes);

// ─── V2 AI & Intelligence Layer ───────────────────────────────────────────────
router.use('/ai', aiRoutes);
router.use('/verification', verificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/approval', approvalRoutes);
router.use('/indexer', indexerRoutes);

// ─── Enhanced Health Check (Module 12) ────────────────────────────────────────
router.get('/health', (req: Request, res) => {
  res.json({
    success: true,
    requestId: req.requestId,
    data: {
      name: 'TrustChain AI API',
      status: 'healthy',
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      modules: {
        auth: true,
        assets: true,
        marketplace: true,
        dao: true,
        portfolio: true,
        'ai-copilot': true,
        verification: true,
        analytics: true,
        payments: true,
        notifications: true,
      },
      integrations: {
        gemini: !!env.GEMINI_API_KEY,
        razorpay: !!env.RAZORPAY_KEY_ID,
        redis: !!env.REDIS_URL,
        pinata: !!env.PINATA_API_KEY && env.PINATA_API_KEY !== 'mock_key',
        blockchain: !!env.POLYGON_AMOY_RPC_URL,
      },
      memory: {
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    },
  });
});

export default router;
