import { supabaseAdmin } from '../../config/database';

export interface AssetPosition {
  assetId: string;
  assetTitle: string;
  assetType: string;
  location: string;
  tokensOwned: number;
  purchasePricePerToken: number;
  currentPricePerToken: number;
  annualYieldPercentage: number;
  expectedCagr: number;
  riskTier: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface SectorAllocation {
  sector: string;
  percentage: number;
  valueINR: number;
}

export interface GeographicAllocation {
  region: string;
  percentage: number;
  valueINR: number;
}

export interface PortfolioIntelligenceReport {
  investorId: string;
  totalNetWorthINR: number;
  totalInvestedINR: number;
  totalUnrealizedGainINR: number;
  unrealizedReturnPercentage: number;
  weightedYieldPercentage: number;
  expectedAnnualIncomeINR: number;
  expectedPortfolioCAGR: number;
  overallRiskTier: 'CONSERVATIVE' | 'BALANCED' | 'GROWTH' | 'HIGH_RISK';
  diversificationScore: number; // 0-100
  sectorAllocations: SectorAllocation[];
  geographicAllocations: GeographicAllocation[];
  estimatedTaxLiabilityINR: number;
  positions: AssetPosition[];
  calculatedAt: string;
}

export class PortfolioIntelligenceService {
  async getPortfolioIntelligence(investorId: string): Promise<PortfolioIntelligenceReport> {
    const calculatedAt = new Date().toISOString();
    const positions: AssetPosition[] = [];

    try {
      const { data: userInvestments } = await supabaseAdmin
        .from('investments')
        .select(`
          id,
          tokens_owned,
          investment_amount,
          asset_id,
          assets (
            id,
            title,
            asset_type,
            location,
            valuation,
            token_price,
            token_supply
          )
        `)
        .eq('investor_id', investorId);

      if (userInvestments && userInvestments.length > 0) {
        for (const inv of userInvestments) {
          const asset = inv.assets as any;
          if (!asset) continue;

          const tokensOwned = Number(inv.tokens_owned || 1);
          const purchasePrice = Number(asset.token_price || 1000);
          const currentPrice = purchasePrice * 1.08; // 8% appreciation simulation

          positions.push({
            assetId: asset.id,
            assetTitle: asset.title || 'Property Asset',
            assetType: asset.asset_type || 'real_estate',
            location: asset.location || 'India',
            tokensOwned,
            purchasePricePerToken: purchasePrice,
            currentPricePerToken: currentPrice,
            annualYieldPercentage: 8.5,
            expectedCagr: 12.0,
            riskTier: 'LOW',
          });
        }
      }
    } catch (err) {
      console.warn('[PortfolioIntelligenceService] Live query fallback:', err);
    }

    let totalInvested = 0;
    let currentNetWorth = 0;
    let weightedYieldSum = 0;
    let weightedCagrSum = 0;

    for (const pos of positions) {
      const invested = pos.tokensOwned * pos.purchasePricePerToken;
      const currentValue = pos.tokensOwned * pos.currentPricePerToken;

      totalInvested += invested;
      currentNetWorth += currentValue;
      weightedYieldSum += pos.annualYieldPercentage * currentValue;
      weightedCagrSum += pos.expectedCagr * currentValue;
    }

    const unrealizedGain = currentNetWorth - totalInvested;
    const unrealizedReturnPct = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;
    const weightedYield = currentNetWorth > 0 ? weightedYieldSum / currentNetWorth : 0;
    const weightedCagr = currentNetWorth > 0 ? weightedCagrSum / currentNetWorth : 0;
    const annualIncome = (currentNetWorth * weightedYield) / 100;

    // Sector Allocation
    const sectorMap: Record<string, number> = {};
    const geoMap: Record<string, number> = {};

    for (const pos of positions) {
      const val = pos.tokensOwned * pos.currentPricePerToken;
      sectorMap[pos.assetType] = (sectorMap[pos.assetType] || 0) + val;
      geoMap[pos.location] = (geoMap[pos.location] || 0) + val;
    }

    const sectorAllocations: SectorAllocation[] = currentNetWorth > 0
      ? Object.entries(sectorMap).map(([sector, val]) => ({
          sector,
          percentage: Number(((val / currentNetWorth) * 100).toFixed(1)),
          valueINR: val,
        }))
      : [];

    const geographicAllocations: GeographicAllocation[] = currentNetWorth > 0
      ? Object.entries(geoMap).map(([region, val]) => ({
          region,
          percentage: Number(((val / currentNetWorth) * 100).toFixed(1)),
          valueINR: val,
        }))
      : [];

    // Estimated Tax Withholding (TDS 10% on dividends under Section 194K)
    const estimatedTaxLiability = annualIncome * 0.10;
    const divScore = positions.length === 0 ? 0 : Math.min(100, positions.length * 35);
    const riskTier = positions.length === 0 ? 'CONSERVATIVE' : (positions.length >= 3 ? 'BALANCED' : 'GROWTH');

    return {
      investorId,
      totalNetWorthINR: currentNetWorth,
      totalInvestedINR: totalInvested,
      totalUnrealizedGainINR: unrealizedGain,
      unrealizedReturnPercentage: Number(unrealizedReturnPct.toFixed(2)),
      weightedYieldPercentage: Number(weightedYield.toFixed(2)),
      expectedAnnualIncomeINR: Math.round(annualIncome),
      expectedPortfolioCAGR: Number(weightedCagr.toFixed(2)),
      overallRiskTier: riskTier,
      diversificationScore: divScore,
      sectorAllocations,
      geographicAllocations,
      estimatedTaxLiabilityINR: Math.round(estimatedTaxLiability),
      positions,
      calculatedAt,
    };
  }
}

export const portfolioIntelligenceService = new PortfolioIntelligenceService();

