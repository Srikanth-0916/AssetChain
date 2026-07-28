import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../../middleware/auth';
import { aiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.use(authenticate);
router.use(aiRateLimiter);

// ─── Core AI Endpoints ─────────────────────────────────────────────────────
router.post('/investment-advice', (req, res, next) => aiController.investmentAdvice(req, res, next));
router.post('/portfolio-analysis', (req, res, next) => aiController.portfolioAnalysis(req, res, next));
router.post('/property-comparison', (req, res, next) => aiController.propertyComparison(req, res, next));
router.post('/risk-analysis', (req, res, next) => aiController.riskAnalysis(req, res, next));
router.post('/market-insights', (req, res, next) => aiController.marketInsights(req, res, next));
router.post('/explain-transaction', (req, res, next) => aiController.explainTransaction(req, res, next));
router.post('/dao-assistant', (req, res, next) => aiController.daoAssistant(req, res, next));
router.post('/document-summary', (req, res, next) => aiController.documentSummary(req, res, next));

// ─── Memory Endpoints (Module 1) ──────────────────────────────────────────
router.post('/preferences', (req, res, next) => aiController.savePreferences(req, res, next));
router.get('/preferences', (req, res, next) => aiController.getPreferences(req, res, next));
router.get('/history', (req, res, next) => aiController.getHistory(req, res, next));
router.delete('/history', (req, res, next) => aiController.clearHistory(req, res, next));

// ─── AI Observability & Telemetry Endpoints ───────────────────────────────
router.get('/observability/stats', (req, res, next) => aiController.getObservabilityStats(req, res, next));
router.get('/observability/logs', (req, res, next) => aiController.getObservabilityLogs(req, res, next));

export default router;
