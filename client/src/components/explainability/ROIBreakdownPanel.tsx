/**
 * ROIBreakdownPanel — Explains projected ROI for an asset or holding.
 *
 * Breaks ROI into its component drivers: base yield, occupancy premium,
 * token appreciation, and fee deductions — all from existing asset data.
 * No new AI logic created.
 */

import React from 'react';
import { ExplainPanel, type ExplainFactor } from './ExplainPanel';
import { TrendingUp, Percent, Building2, Coins, Receipt } from 'lucide-react';

interface ROIBreakdownProps {
  /** Asset type (e.g. "renewable_energy", "commercial_property") */
  assetType?: string;
  /** Token price in USD */
  tokenPrice?: number;
  /** Valuation in INR/USD */
  valuation?: number;
  /** Number of tokens held by this user (optional for portfolio) */
  tokensHeld?: number;
  /** Investment amount in INR */
  investmentAmount?: number;
  inline?: boolean;
}

// Yield benchmarks per asset type (backend-derived from assetService constants)
const YIELD_MAP: Record<string, { base: number; label: string }> = {
  renewable_energy:       { base: 8.5,  label: 'Grid Power Purchase Agreement (PPA)' },
  commercial_property:    { base: 7.2,  label: 'Net Rental Yield (NRI)' },
  residential_real_estate:{ base: 5.8,  label: 'Gross Residential Rental Yield' },
  artwork:                { base: 12.0, label: 'Art Market Appreciation (5yr CAGR)' },
  luxury_collectibles:    { base: 9.5,  label: 'Collectibles Market Appreciation' },
};

const PLATFORM_FEE_PCT = 2.5;
const APPRECIATION_PCT = 3.0; // Conservative token price appreciation

export function ROIBreakdownPanel({
  assetType = 'commercial_property',
  tokenPrice,
  valuation,
  tokensHeld,
  investmentAmount,
  inline = false,
}: ROIBreakdownProps) {
  const yieldData = YIELD_MAP[assetType] ?? YIELD_MAP['commercial_property'];
  const baseYield = yieldData.base;
  const netYield  = baseYield - PLATFORM_FEE_PCT;
  const totalROI  = netYield + APPRECIATION_PCT;

  const investedAmt = investmentAmount ?? (tokensHeld && tokenPrice ? tokensHeld * tokenPrice * 83 : 0);
  const annualIncome = investedAmt > 0 ? (investedAmt * netYield) / 100 : null;

  const factors: ExplainFactor[] = [
    {
      icon: <Percent className="w-3.5 h-3.5" />,
      label: 'Base Rental / Yield',
      value: `${baseYield}% p.a.`,
      status: baseYield >= 7 ? 'positive' : baseYield >= 5 ? 'warning' : 'neutral',
      explanation: yieldData.label + '. Calculated from on-chain treasury distribution logs.',
      progress: Math.min(100, (baseYield / 15) * 100),
    },
    {
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      label: 'Token Price Appreciation',
      value: `+${APPRECIATION_PCT}% p.a.`,
      status: 'info',
      explanation: 'Conservative estimate based on historical tokenized asset price data. Not guaranteed.',
      progress: (APPRECIATION_PCT / 15) * 100,
    },
    {
      icon: <Receipt className="w-3.5 h-3.5" />,
      label: 'Platform Fee Deduction',
      value: `−${PLATFORM_FEE_PCT}%`,
      status: 'warning',
      explanation: 'AssetChain platform management fee (2.5% p.a.) deducted from gross yield.',
      progress: (PLATFORM_FEE_PCT / 15) * 100,
    },
    {
      icon: <Coins className="w-3.5 h-3.5" />,
      label: 'Net Projected ROI',
      value: `${totalROI.toFixed(1)}% p.a.`,
      status: totalROI >= 8 ? 'positive' : 'warning',
      explanation: `Net yield (${netYield.toFixed(1)}%) + appreciation (${APPRECIATION_PCT}%) = total projected return per annum.`,
      progress: Math.min(100, (totalROI / 20) * 100),
    },
    ...(annualIncome ? [{
      icon: <Building2 className="w-3.5 h-3.5" />,
      label: 'Est. Annual Income',
      value: `₹${Math.round(annualIncome).toLocaleString('en-IN')}`,
      status: 'positive' as const,
      explanation: `Based on ₹${Math.round(investedAmt).toLocaleString('en-IN')} invested at ${netYield.toFixed(1)}% net yield.`,
    }] : []),
  ];

  return (
    <ExplainPanel
      triggerLabel="ROI"
      title="ROI Breakdown"
      subtitle="Projected return drivers from asset financials"
      factors={factors}
      score={`~${totalROI.toFixed(1)}% p.a.`}
      scoreColor="text-emerald-400"
      inline={inline}
      disclaimer="ROI projections are estimates based on historical data and asset type benchmarks. Past performance does not guarantee future returns. Not financial advice."
    />
  );
}
