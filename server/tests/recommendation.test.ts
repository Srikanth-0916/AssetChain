import { describe, it, expect } from 'vitest';
import { recommendationEngine, AssetMetrics, UserContext } from '../src/modules/recommendation/recommendation.engine';
import { investmentRecommendationService } from '../src/modules/recommendation/investmentRecommendation.service';

describe('Deterministic AI Recommendation Engine Test Suite', () => {
  const sampleAssets: AssetMetrics[] = [
    {
      id: 'asset-01',
      title: 'Solar Farm Alpha 1',
      assetType: 'renewable_energy',
      location: 'Valencia, Spain',
      valuation: 1200000,
      tokenPrice: 120,
      tokenSupply: 10000,
      verificationStatus: 'tokenized',
      roi: 9.5,
      occupancy: 95,
      liquidity: 90,
      riskScore: 12, // Low Risk
    },
    {
      id: 'asset-02',
      title: 'Manhattan Commercial Plaza',
      assetType: 'commercial_property',
      location: 'New York, USA',
      valuation: 2500000,
      tokenPrice: 250,
      tokenSupply: 10000,
      verificationStatus: 'tokenized',
      roi: 8.4,
      occupancy: 98,
      liquidity: 85,
      riskScore: 22, // Low-Medium Risk
    },
    {
      id: 'asset-03',
      title: 'High Risk Speculative Real Estate',
      assetType: 'residential_real_estate',
      location: 'Uncertain Location',
      valuation: 500000,
      tokenPrice: 50,
      tokenSupply: 10000,
      verificationStatus: 'tokenized',
      roi: 14.0,
      occupancy: 60,
      liquidity: 40,
      riskScore: 75, // High Risk
    },
  ];

  it('Should deterministically score and rank assets', () => {
    const user: UserContext = {
      userId: 'user-001',
      budget: 50000,
      currency: 'INR',
      riskPreference: 'low',
      existingHoldingsCount: 0,
    };

    const result = recommendationEngine.calculate(user, sampleAssets);

    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.recommendedAllocation.length).toBeGreaterThan(0);

    // High risk asset (riskScore 75) should be filtered out for 'low' risk preference user
    const highRiskIncluded = result.recommendedAllocation.some((r) => r.assetId === 'asset-03');
    expect(highRiskIncluded).toBe(false);

    // Top asset should be Solar Farm (low risk 12, 9.5% ROI)
    expect(result.recommendedAllocation[0].assetId).toBe('asset-01');
    expect(result.recommendedAllocation[0].percentage).toBeGreaterThan(0);

    console.log('✓ Deterministic Ranking:', result.recommendedAllocation.map(r => `${r.assetName} (${r.percentage}%, $${r.allocationAmount})`));
  });

  it('Should handle case when no assets qualify for user risk profile', () => {
    const user: UserContext = {
      userId: 'user-002',
      budget: 10000,
      currency: 'INR',
      riskPreference: 'low',
      existingHoldingsCount: 0,
    };

    const highRiskAssetsOnly: AssetMetrics[] = [
      {
        id: 'asset-high-risk',
        title: 'Speculative Asset',
        assetType: 'residential_real_estate',
        location: 'High Volatility Region',
        valuation: 100000,
        tokenPrice: 100,
        tokenSupply: 1000,
        verificationStatus: 'tokenized',
        roi: 18.0,
        occupancy: 40,
        liquidity: 30,
        riskScore: 85, // Filtered out for low risk
      },
    ];

    const result = recommendationEngine.calculate(user, highRiskAssetsOnly);
    expect(result.status).toBe('no_qualifying_assets');
    expect(result.message).toContain('No suitable investment opportunities');
  });

  it('Should generate full investment recommendation via service layer with live data', async () => {
    const res = await investmentRecommendationService.generateRecommendation(
      'investor-demo-uuid-001',
      50000,
      'INR',
      'medium'
    );

    expect(res).toBeDefined();
    expect(res.budget).toBe(50000);
    expect(res.currency).toBe('INR');
    expect(res.recommendedAllocation).toBeInstanceOf(Array);
    expect(res.generatedAt).toBeDefined();

    console.log('✓ Investment Recommendation Result:', {
      budget: res.budget,
      currency: res.currency,
      allocationsCount: res.recommendedAllocation.length,
      overallConfidence: res.overallConfidence,
    });
  }, 15000);
});
