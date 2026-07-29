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

export interface ScoreBreakdown {
  overallScore: number;         // 0-100 composite investment score
  roiScore: number;             // Contribution from ROI dimension
  riskScore: number;            // Contribution from risk (inverse)
  liquidityScore: number;       // Contribution from liquidity
  occupancyScore: number;       // Contribution from occupancy
  marketTrendScore: number;     // Contribution from market trend
  diversificationImpact: string; // Human-readable diversification benefit
  weights: {                    // Scoring weights used (transparent)
    roi: number;
    risk: number;
    liquidity: number;
    occupancy: number;
    marketTrend: number;
  };
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
  // ── Explainability fields ──────────────────────────────
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];            // Deterministic bullet points (why this asset)
  warnings: string[];           // Risk warnings from deterministic checks
}

export interface AlternativeAsset {
  assetName: string;
  investmentScore: number;
  reason: string;               // Why it ranked lower
}

export interface DeterministicEngineResult {
  status: 'success' | 'no_qualifying_assets' | 'error';
  message?: string;
  budget: number;
  currency: string;
  recommendedAllocation: RecommendedItem[];
  rankedAssets: ScoredAsset[];
  alternativeAssets: AlternativeAsset[];  // Assets considered but not selected
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
        alternativeAssets: [],
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
        alternativeAssets: [],
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

    const WEIGHTS = { roi: 0.30, risk: 0.25, liquidity: 0.20, occupancy: 0.15, marketTrend: 0.10 };

    const recommendedAllocation: RecommendedItem[] = selected.map((item, index) => {
      const weight = weights[index];
      const allocationAmount = Math.round(user.budget * weight);
      const percentage = Math.round(weight * 100);
      const tokensToBuy = item.asset.tokenPrice > 0 ? Math.floor(allocationAmount / item.asset.tokenPrice) : 0;
      const riskLevel = item.asset.riskScore < 20 ? 'Low Risk' : item.asset.riskScore < 45 ? 'Medium Risk' : 'High Risk';
      const confidence = Math.min(99, Math.max(70, item.investmentScore));

      // ── Deterministic Score Breakdown ──────────────────────────────────────
      const diversificationTypes = selected.map((s) => s.asset.assetType);
      const uniqueTypes = new Set(diversificationTypes).size;
      const diversificationImpact =
        uniqueTypes > 1
          ? `+${uniqueTypes * 8} points to portfolio diversity (${uniqueTypes} asset types)`
          : user.existingHoldingsCount > 0
          ? '+5 points to portfolio diversity (adds to existing holdings)'
          : 'First investment — establishes portfolio baseline';

      const scoreBreakdown: ScoreBreakdown = {
        overallScore: item.investmentScore,
        roiScore: item.roiScore,
        riskScore: item.riskScoreComp,
        liquidityScore: item.liquidityScore,
        occupancyScore: item.occupancyScore,
        marketTrendScore: item.marketTrendScore,
        diversificationImpact,
        weights: WEIGHTS,
      };

      // ── Deterministic Reasons (bullet points from data) ─────────────────
      const reasons: string[] = [];
      if (item.roiScore >= 70) reasons.push(`Strong annual yield of ${item.asset.roi}% (ROI score: ${item.roiScore}/100)`);
      if (item.riskScoreComp >= 75) reasons.push(`Low fraud risk — clean AI fraud analysis (risk score: ${item.asset.riskScore}/100, lower is better)`);
      if (item.occupancyScore >= 85) reasons.push(`High occupancy rate (~${item.asset.occupancy}%) indicates stable income generation`);
      if (item.liquidityScore >= 80) reasons.push(`High token liquidity (${item.asset.liquidity}/100) — easier to exit position if needed`);
      if (item.asset.spvName) reasons.push(`Backed by verified SPV: ${item.asset.spvName}`);
      if (item.asset.verificationStatus === 'tokenized') reasons.push('Asset is fully tokenized and actively trading on the marketplace');
      if (item.marketTrendScore >= 90) reasons.push(`Asset type (${item.asset.assetType.replace(/_/g, ' ')}) shows strong market trend score (${item.marketTrendScore}/100)`);
      if (reasons.length === 0) reasons.push(`Investment score of ${item.investmentScore}/100 meets ${user.riskPreference} risk profile criteria`);

      // ── Deterministic Warnings (from data checks) ─────────────────────
      const warnings: string[] = [];
      if (item.asset.riskScore >= 30) warnings.push(`Moderate fraud risk score (${item.asset.riskScore}/100) — recommend reviewing asset documents before investing`);
      if (item.asset.liquidity < 70) warnings.push(`Lower liquidity (${item.asset.liquidity}/100) — this position may be harder to exit quickly`);
      if (percentage >= 60) warnings.push(`This allocation represents ${percentage}% of your budget — consider diversifying further`);
      if (item.asset.assetType === 'residential_real_estate') warnings.push('Residential real estate returns are subject to local market conditions and regulatory changes');

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
        scoreBreakdown,
        reasons,
        warnings,
      };
    });

    // ── Alternative Assets (not selected — explain why) ─────────────────────
    const alternativeAssets: AlternativeAsset[] = scoredAssets
      .slice(count) // Assets ranked but not selected
      .map((item) => ({
        assetName: item.asset.title,
        investmentScore: item.investmentScore,
        reason: item.asset.riskScore > (user.riskPreference === 'low' ? 35 : 60)
          ? `Excluded: fraud risk score of ${item.asset.riskScore}/100 exceeds your ${user.riskPreference} risk profile threshold`
          : `Ranked lower: investment score ${item.investmentScore}/100 vs top pick ${scoredAssets[0].investmentScore}/100. Lower ${item.asset.roi < (scoredAssets[0]?.asset.roi || 0) ? 'ROI' : 'occupancy or liquidity'} metrics.`,
      }));

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
      alternativeAssets,
      portfolioRisk: user.riskPreference,
      diversificationScore,
      overallConfidence: avgConfidence,
      calculatedAt: timestamp,
    };
  }
}


export const recommendationEngine = new RecommendationEngine();
