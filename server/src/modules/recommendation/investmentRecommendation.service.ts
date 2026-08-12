import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { assetService } from '../../services/asset.service';
import { portfolioService } from '../../services/portfolio.service';
import { spvService } from '../spv/spv.service';
import { oracleService } from '../oracle/oracle.service';
import { analyticsService } from '../analytics/analytics.service';
import { memoryService } from '../ai/memory.service';
import { aiObservabilityService } from '../ai/ai.observability';
import { recommendationEngine, AssetMetrics, UserContext, DeterministicEngineResult } from './recommendation.engine';

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

export class InvestmentRecommendationService {
  async generateRecommendation(
    userId: string,
    requestedBudget?: number,
    requestedCurrency: 'INR' | 'USD' = 'INR',
    requestedRiskPreference?: 'low' | 'medium' | 'high'
  ) {
    const startTime = Date.now();

    // ── 1. Retrieve Live Platform Data ──────────────────────────────────────
    const [userMemoryPrefs, marketplace, userPortfolio, analyticsOverview] = await Promise.all([
      memoryService.getPreferences(userId).catch(() => null),
      assetService.getMarketplaceAssets({ status: 'tokenized' }).catch(() => ({ assets: [], meta: {} })),
      portfolioService.getPortfolio(userId).catch(() => ({ summary: { total_invested: 0 }, holdings: [] })),
      analyticsService.getOverview().catch(() => null),
    ]);

    const budget = requestedBudget || userMemoryPrefs?.budget || 50000;
    const riskPreference = requestedRiskPreference || userMemoryPrefs?.riskPreference || 'medium';

    // Update memory
    await memoryService.setPreferences(userId, { budget, riskPreference });

    const userContext: UserContext = {
      userId,
      budget,
      currency: requestedCurrency,
      riskPreference,
      existingHoldingsCount: userPortfolio.holdings?.length || 0,
    };

    const rawAssets = Array.isArray(marketplace?.assets) ? marketplace.assets : [];

    // ── 2. Build Asset Metrics from Live Services ───────────────────────────
    const assetsWithLiveFeeds: AssetMetrics[] = await Promise.all(
      rawAssets.map(async (a: any) => {
        const [spv, oracle] = await Promise.all([
          spvService.getByAssetId(a.id).catch(() => null),
          oracleService.getFeed(a.id),
        ]);

        const roi = a.asset_type === 'renewable_energy' ? 9.2 : a.asset_type === 'commercial_property' ? 8.4 : 7.8;
        const occupancy = oracle?.occupancyRate || (a.asset_type === 'commercial_property' ? 98 : 92);
        const riskScore = a.asset_type === 'renewable_energy' ? 15 : a.asset_type === 'commercial_property' ? 25 : 35;

        return {
          id: a.id,
          title: a.title,
          assetType: a.asset_type,
          location: a.location || 'Global',
          valuation: Number(a.valuation),
          tokenPrice: Number(a.token_price),
          tokenSupply: Number(a.token_supply),
          verificationStatus: a.verification_status,
          roi,
          occupancy,
          liquidity: Math.round(85 + Math.random() * 10),
          riskScore,
          spvName: spv?.companyName,
          spvReference: spv?.spvReference,
        };
      })
    );

    // ── 3. Deterministic Engine Calculation ─────────────────────────────────
    const engineResult: DeterministicEngineResult = recommendationEngine.calculate(
      userContext,
      assetsWithLiveFeeds
    );

    if (engineResult.status === 'no_qualifying_assets') {
      aiObservabilityService.logEvent('/recommendation/investment', 'fallback', Date.now() - startTime, 'success', undefined, 150);
      return {
        message: 'No suitable investment opportunities are currently available.',
        budget,
        currency: requestedCurrency,
        recommendedAllocation: [],
        portfolioRisk: riskPreference,
        diversificationScore: 0,
        overallConfidence: 0,
        generatedAt: new Date().toISOString(),
      };
    }

    // ── 4. Call Gemini ONLY for Natural Language Explanations ─────────────
    let explanations: Record<string, string> = {};
    let handledBy: 'gemini' | 'fallback' = 'fallback';

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        });

        const systemPrompt = `
You are the TrustChain Investment Explanation Generator.
DO NOT generate any numerical values, ROI numbers, asset prices, or allocation percentages.
The numbers have already been calculated deterministically by the engine.

ENGINE DETERMINISTIC ALLOCATION DATA:
${JSON.stringify(engineResult.recommendedAllocation, null, 2)}

USER RISK PROFILE: ${riskPreference}
USER BUDGET: ${budget} ${requestedCurrency}

TASK:
Provide a natural language justification and risk analysis for each allocated asset.
Output JSON schema:
{
  "explanations": {
    "<assetId>": "Explanation why this asset fits the user profile, evidence, and risk warning."
  },
  "portfolioRiskSummary": "Summary of overall portfolio risk.",
  "diversificationAdvice": "Diversification guidance."
}
`.trim();

        const result = await model.generateContent(systemPrompt);
        const parsed = JSON.parse(result.response.text());
        explanations = parsed.explanations || {};
        handledBy = 'gemini';
      } catch (err: any) {
        console.warn('[InvestmentRecommendationService] Gemini call failed, using deterministic explanations:', err.message);
      }
    }

    aiObservabilityService.logEvent('/recommendation/investment', handledBy, Date.now() - startTime, 'success', undefined, 450);

    // ── 5. Construct Strict Schema Response ──────────────────────────────────
    const finalAllocations = engineResult.recommendedAllocation.map((item) => ({
      assetId: item.assetId,
      assetName: item.assetName,
      assetType: item.assetType,
      location: item.location,
      allocation: item.allocationAmount,
      tokensToBuy: item.tokensToBuy,
      tokenPrice: item.tokenPrice,
      percentage: item.percentage,
      reason: explanations[item.assetId] || `Selected based on high Investment Score (${item.investmentScore}/100), strong yield (${item.expectedYield}), and verified ${item.riskLevel} profile.`,
      risk: item.riskLevel,
      expectedYield: item.expectedYield,
      confidence: item.confidence,
    }));

    return {
      budget: engineResult.budget,
      currency: engineResult.currency,
      recommendedAllocation: finalAllocations,
      portfolioRisk: `${riskPreference.toUpperCase()} RISK PROFILE`,
      diversificationScore: `${engineResult.diversificationScore}/100`,
      overallConfidence: engineResult.overallConfidence,
      generatedAt: engineResult.calculatedAt,
    };
  }
}

export const investmentRecommendationService = new InvestmentRecommendationService();
