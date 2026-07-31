import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';
import { portfolioIntelligenceService } from './portfolio.intelligence.service';
import { assetComparisonService } from './asset.comparison.service';
import { assetHealthScorecardService } from './asset.health.scorecard';
import { exitPredictionService } from './exit.prediction.service';

const router = Router();

// Public / Investor Portfolio Intelligence Endpoint
router.get('/portfolio-intelligence/:investorId', async (req, res, next) => {
  try {
    const report = await portfolioIntelligenceService.getPortfolioIntelligence(req.params.investorId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// Side-by-Side Asset Comparison Engine
router.post('/compare-assets', async (req, res, next) => {
  try {
    const { assetIds } = req.body;
    const ids = Array.isArray(assetIds) && assetIds.length > 0 ? assetIds : ['ast-com-01', 'ast-sol-02', 'ast-res-03'];
    const comparison = await assetComparisonService.compareAssets(ids);
    res.json({ success: true, data: comparison });
  } catch (err) {
    next(err);
  }
});

// 5-Axis Asset Health Scorecard (Google Lighthouse Style)
router.get('/health-scorecard/:assetId', async (req, res, next) => {
  try {
    const scorecard = await assetHealthScorecardService.getHealthScorecard(req.params.assetId);
    res.json({ success: true, data: scorecard });
  } catch (err) {
    next(err);
  }
});

// Exit Prediction & Liquidity Engine
router.get('/exit-prediction/:assetId', async (req, res, next) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 36;
    const prediction = await exitPredictionService.predictExit(req.params.assetId, months);
    res.json({ success: true, data: prediction });
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);
router.use(roleGuard('admin'));

router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));

export default router;
