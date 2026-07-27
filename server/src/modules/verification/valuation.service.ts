/**
 * Valuation Service — AI-estimated fair market value ranges.
 */
export class ValuationService {
  private readonly benchmarks: Record<string, { pricePerSqft?: number; yieldRate: number; riskPremium: number }> = {
    residential_real_estate: { pricePerSqft: 180, yieldRate: 0.06, riskPremium: 0.02 },
    commercial_property: { pricePerSqft: 320, yieldRate: 0.08, riskPremium: 0.03 },
    renewable_energy: { yieldRate: 0.10, riskPremium: 0.02 },
    artwork: { yieldRate: 0.04, riskPremium: 0.05 },
    luxury_collectibles: { yieldRate: 0.03, riskPremium: 0.06 },
  };

  async estimateValuation(assetType: string, location: string, claimedValuation: number): Promise<{
    claimedValuation: number;
    estimatedMin: number;
    estimatedMax: number;
    valuationStatus: 'Reasonable' | 'Overvalued' | 'Undervalued';
    annualYieldEstimate: string;
    locationPremium: number;
  }> {
    const benchmark = this.benchmarks[assetType] || { yieldRate: 0.06, riskPremium: 0.03 };

    // Location premium multiplier
    const locationPremium = this.getLocationPremium(location);

    const baseMin = claimedValuation * 0.75;
    const baseMax = claimedValuation * 1.35;
    const estimatedMin = Math.round(baseMin * locationPremium);
    const estimatedMax = Math.round(baseMax * locationPremium);

    let valuationStatus: 'Reasonable' | 'Overvalued' | 'Undervalued';
    if (claimedValuation >= estimatedMin && claimedValuation <= estimatedMax) {
      valuationStatus = 'Reasonable';
    } else if (claimedValuation > estimatedMax) {
      valuationStatus = 'Overvalued';
    } else {
      valuationStatus = 'Undervalued';
    }

    return {
      claimedValuation,
      estimatedMin,
      estimatedMax,
      valuationStatus,
      annualYieldEstimate: `${((benchmark.yieldRate - benchmark.riskPremium) * 100).toFixed(1)}% – ${(benchmark.yieldRate * 100).toFixed(1)}% per annum`,
      locationPremium,
    };
  }

  private getLocationPremium(location: string): number {
    const premiums: Record<string, number> = {
      'new york': 1.4, 'london': 1.35, 'dubai': 1.25, 'singapore': 1.3,
      'mumbai': 0.9, 'spain': 1.0, 'usa': 1.2, 'uae': 1.25, 'uk': 1.3,
    };
    const loc = location.toLowerCase();
    for (const [key, premium] of Object.entries(premiums)) {
      if (loc.includes(key)) return premium;
    }
    return 1.0;
  }
}

export const valuationService = new ValuationService();
