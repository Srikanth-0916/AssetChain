import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from './ai.service';
import { memoryService } from './memory.service';
import { aiObservabilityService } from './ai.observability';
import { sendSuccess } from '../../utils/response';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const preferencesSchema = z.object({
  budget: z.number().positive().optional(),
  riskPreference: z.enum(['low', 'medium', 'high']).optional(),
  preferredAssetTypes: z.array(z.string()).optional(),
  investmentGoal: z.string().max(200).optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class AIController {
  /** POST /ai/chat */
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt = '', budget = 10000, risk_preference = 'medium' } = req.body;
      const result = await aiService.chat(
        req.user!.userId,
        prompt,
        Number(budget),
        risk_preference as 'low' | 'medium' | 'high'
      );
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/investment-advice */
  async investmentAdvice(req: Request, res: Response, next: NextFunction) {
    try {
      const { budget = 10000, risk_preference = 'medium' } = req.body;
      const result = await aiService.getInvestmentAdvice(
        req.user!.userId,
        Number(budget),
        risk_preference as 'low' | 'medium' | 'high'
      );
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/portfolio-analysis */
  async portfolioAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.analyzePortfolio(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/property-comparison */
  async propertyComparison(req: Request, res: Response, next: NextFunction) {
    try {
      const { asset_ids = [] } = req.body;
      const result = await aiService.compareProperties(req.user!.userId, asset_ids as string[]);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/risk-analysis */
  async riskAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { asset_id } = req.body;
      const result = await aiService.analyzeRisk(req.user!.userId, asset_id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/market-insights */
  async marketInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getMarketInsights(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/explain-transaction */
  async explainTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { tx_hash = '0x000...demo' } = req.body;
      const result = await aiService.explainTransaction(req.user!.userId, tx_hash);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/dao-assistant */
  async daoAssistant(req: Request, res: Response, next: NextFunction) {
    try {
      const { proposal_id } = req.body;
      const result = await aiService.daoAssistant(req.user!.userId, proposal_id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  /** POST /ai/document-summary */
  async documentSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { ipfs_cid = 'QmMockCid' } = req.body;
      const result = await aiService.summarizeDocument(req.user!.userId, ipfs_cid);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  // ── Memory Endpoints (Module 1) ──────────────────────────────────────────

  /** POST /ai/preferences — save investment preferences */
  async savePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = preferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      }
      const prefs = await memoryService.setPreferences(req.user!.userId, parsed.data);
      sendSuccess(res, { preferences: prefs, message: 'Preferences saved. AI Copilot will now remember your settings.' });
    } catch (error) { next(error); }
  }

  /** GET /ai/preferences — get saved preferences */
  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await memoryService.getPreferences(req.user!.userId);
      sendSuccess(res, prefs);
    } catch (error) { next(error); }
  }

  /** GET /ai/history — get conversation history */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await memoryService.getHistory(req.user!.userId);
      sendSuccess(res, { history, count: history.length });
    } catch (error) { next(error); }
  }

  /** DELETE /ai/history — clear conversation history */
  async clearHistory(req: Request, res: Response, next: NextFunction) {
    try {
      await memoryService.clearHistory(req.user!.userId);
      sendSuccess(res, { message: 'Conversation history cleared.' });
    } catch (error) { next(error); }
  }

  /** GET /ai/observability/stats — AI Observability Telemetry Metrics */
  async getObservabilityStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = aiObservabilityService.getStats();
      sendSuccess(res, stats);
    } catch (error) { next(error); }
  }

  /** GET /ai/observability/logs — Recent AI Observability Request Telemetry Logs */
  async getObservabilityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = aiObservabilityService.getLogs();
      sendSuccess(res, logs);
    } catch (error) { next(error); }
  }
}

export const aiController = new AIController();
