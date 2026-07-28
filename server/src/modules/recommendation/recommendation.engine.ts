export interface AssetMetrics {
  id: string;
  title: string;
  assetType: string;
  location: string;
  valuation: number;
  tokenPrice: number;
  tokenSupply: number;
  verificationStatus: string;
  roi: number; // e.g. 8.5 (%)
  occupancy: number; // e.g. 95 (%)
  liquidity: number; // 0-100
  riskScore: number; // 0-100 (0=clean, 100=high risk)
  spvName?: string;
  spvReference?: string;
}

export interface UserContext {
  userId: string;
  budget: number;
  currency: 'INR' | 'USD';
  riskPreference: 'low' | 'medium' | 'high';
  existingHoldingsCount: number;
}

export interface ScoredAsset {
  asset: AssetMetrics;
  investmentScore: number;
  roiScore: number;
  riskScoreComp: number;
  liquidityScore: number;
  occupancyScore: number;
  marketTrendScore: number;
}

export interface RecommendedItem {
  assetId: string;
  assetName: string;
  assetType: string;
  location: string;
  tokenPrice: number;
  allocationAmount: number;
  tokensToBuy: number;
  percentage: number;
  expectedYield: string;
  riskLevel: string;
  investmentScore: number;
  confidence: number;
}

export interface DeterministicEngineResult {
  status: 'success' | 'no_qualifying_assets' | 'error';
  message?: string;
  budget: number;
  currency: string;
  recommendedAllocation: RecommendedItem[];
  rankedAssets: ScoredAsset[];
  portfolioRisk: string;
  diversificationScore: number;
  overallConfidence: number;
  calculatedAt: string;
}

export class RecommendationEngine {
  /**
   * Deterministically calculate asset investment scores, filter by risk tolerance,
   * and allocate budget across qualifying assets.
   */
  calculate(user: UserContext, assets: AssetMetrics[]): DeterministicEngineResult {
    const timestamp = new Date().toISOString();

    if (!assets || assets.length === 0) {
      return {
        status: 'no_qualifying_assets',
        message: 'No suitable investment opportunities are currently available.',
        budget: user.budget,
        currency: user.currency,
        recommendedAllocation: [],
        rankedAssets: [],
        portfolioRisk: 'Unknown',
        diversificationScore: 0,
        overallConfidence: 0,
        calculatedAt: timestamp,
      };
    }

    // 1. Risk Profile Filtering
    const qualifying = assets.filter((a) => {
      if (a.verificationStatus !== 'tokenized' && a.verificationStatus !== 'approved') {
        return false;
      }
      if (user.riskPreference === 'low') {
        return a.riskScore <= 35 || a.assetType === 'renewable_energy';
      }
      if (user.riskPreference === 'medium') {
        return a.riskScore <= 60;
      }
      return true; // high risk accepts all
    });

    if (qualifying.length === 0) {
      return {
        status: 'no_qualifying_assets',
        message: 'No suitable investment opportunities are currently available.',
        budget: user.budget,
        currency: user.currency,
        recommendedAllocation: [],
        rankedAssets: [],
        portfolioRisk: user.riskPreference,
        diversificationScore: 0,
        overallConfidence: 0,
        calculatedAt: timestamp,
      };
    }

    // 2. Deterministic Investment Score Calculation
    // Investment Score = 30% ROI + 25% Risk + 20% Liquidity + 15% Occupancy + 10% Market Trend
    const scoredAssets: ScoredAsset[] = qualifying.map((a) => {
      const roiScore = Math.min(100, Math.max(0, (a.roi / 15) * 100)); // 15% max scaling
      const riskScoreComp = Math.max(0, 100 - a.riskScore); // Inverse risk
      const liquidityScore = Math.min(100, a.liquidity || 80);
      const occupancyScore = Math.min(100, a.occupancy || 90);
      const marketTrendScore = a.assetType === 'renewable_energy' ? 95 : a.assetType === 'commercial_property' ? 88 : 82;

      const investmentScore = Math.round(
        0.30 * roiScore +
        0.25 * riskScoreComp +
        0.20 * liquidityScore +
        0.15 * occupancyScore +
        0.10 * marketTrendScore
      );

      return {
        asset: a,
        investmentScore,
        roiScore: Math.round(roiScore),
        riskScoreComp: Math.round(riskScoreComp),
        liquidityScore: Math.round(liquidityScore),
        occupancyScore: Math.round(occupancyScore),
        marketTrendScore: Math.round(marketTrendScore),
      };
    });

    // Sort descending by Investment Score
    scoredAssets.sort((a, b) => b.investmentScore - a.investmentScore);

    // Pick top qualifying assets (up to 3)
    const selected = scoredAssets.slice(0, 3);
    const count = selected.length;

    // Deterministic Budget Allocation Weights
    const weights = count === 1 ? [1.0] : count === 2 ? [0.6, 0.4] : [0.5, 0.3, 0.2];

    const recommendedAllocation: RecommendedItem[] = selected.map((item, index) => {
      const weight = weights[index];
      const allocationAmount = Math.round(user.budget * weight);
      const percentage = Math.round(weight * 100);
      const tokensToBuy = item.asset.tokenPrice > 0 ? Math.floor(allocationAmount / item.asset.tokenPrice) : 0;
      const riskLevel = item.asset.riskScore < 20 ? 'Low Risk' : item.asset.riskScore < 45 ? 'Medium Risk' : 'High Risk';
      const confidence = Math.min(99, Math.max(70, item.investmentScore));

      return {
        assetId: item.asset.id,
        assetName: item.asset.title,
        assetType: item.asset.assetType,
        location: item.asset.location,
        tokenPrice: item.asset.tokenPrice,
        allocationAmount,
        tokensToBuy,
        percentage,
        expectedYield: `${item.asset.roi}% annual yield`,
        riskLevel,
        investmentScore: item.investmentScore,
        confidence,
      };
    });

    const avgConfidence = Math.round(
      recommendedAllocation.reduce((sum, r) => sum + r.confidence, 0) / (recommendedAllocation.length || 1)
    );

    const diversificationScore = Math.min(100, count * 33 + (user.existingHoldingsCount > 0 ? 10 : 0));

    return {
      status: 'success',
      budget: user.budget,
      currency: user.currency,
      recommendedAllocation,
      rankedAssets: scoredAssets,
      portfolioRisk: user.riskPreference,
      diversificationScore,
      overallConfidence: avgConfidence,
      calculatedAt: timestamp,
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
