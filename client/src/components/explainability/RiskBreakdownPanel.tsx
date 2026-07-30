/**
 * RiskBreakdownPanel — Explains the risk assessment of an asset or portfolio.
 *
 * Draws on fraud score, liquidity, asset type risk tier, and diversification
 * data already computed by the trust service and portfolio service.
 * No new AI logic created.
 */

import React from 'react';
import { ExplainPanel, type ExplainFactor } from './ExplainPanel';
import { Brain, Layers, ShieldAlert, PieChart, Zap } from 'lucide-react';
import type { FactorStatus } from './ExplainPanel';

interface RiskBreakdownProps {
  /** 0-100 AI fraud score (lower = safer) */
  fraudScore?: number;
  /** 0-100 liquidity index from trust service */
  liquidityIndex?: number;
  /** Asset type for inherent risk */
  assetType?: string;
  /** Overall risk tier from trust/compliance service */
  riskTier?: 'low' | 'medium' | 'high' | 'very_high';
  /** Portfolio diversification score 0-100 (for portfolio context) */
  diversificationScore?: number;
  /** Whether this is for a portfolio (vs single asset) */
  forPortfolio?: boolean;
  inline?: boolean;
}

// Inherent risk per asset type
const ASSET_RISK: Record<string, { label: string; riskPct: number; status: FactorStatus }> = {
  renewable_energy:        { label: 'Grid-backed solar — very low default risk', riskPct: 15, status: 'positive' },
  commercial_property:     { label: 'Commercial real estate — moderate vacancy risk', riskPct: 30, status: 'warning' },
  residential_real_estate: { label: 'Residential RE — low vacancy, tenant risk', riskPct: 20, status: 'positive' },
  artwork:                 { label: 'Art market — high price volatility, illiquid', riskPct: 65, status: 'negative' },
  luxury_collectibles:     { label: 'Collectibles — volatile, niche market', riskPct: 55, status: 'warning' },
};

export function RiskBreakdownPanel({
  fraudScore = 15,
  liquidityIndex = 85,
  assetType = 'commercial_property',
  riskTier = 'medium',
  diversificationScore,
  forPortfolio = false,
  inline = false,
}: RiskBreakdownProps) {
  const assetRisk = ASSET_RISK[assetType] ?? ASSET_RISK['commercial_property'];

  // Fraud risk factor (inverted: lower fraud score = safer)
  const fraudStatus: FactorStatus = fraudScore < 20 ? 'positive' : fraudScore < 50 ? 'warning' : 'negative';
  const fraudLabel  = fraudScore < 20 ? 'Clean' : fraudScore < 50 ? 'Moderate Risk' : 'High Risk';

  // Liquidity risk (higher index = better)
  const liqStatus: FactorStatus = liquidityIndex >= 70 ? 'positive' : liquidityIndex >= 40 ? 'warning' : 'negative';

  // Overall risk tier color
  const tierStatus: FactorStatus =
    riskTier === 'low' ? 'positive' :
    riskTier === 'medium' ? 'warning' :
    riskTier === 'high' ? 'negative' : 'negative';

  const overallScore = Math.round(
    100 - (fraudScore * 0.3 + assetRisk.riskPct * 0.4 + (100 - liquidityIndex) * 0.3)
  );

  const factors: ExplainFactor[] = [
    {
      icon: <Brain className="w-3.5 h-3.5" />,
      label: 'AI Fraud Detection Score',
      value: `${fraudScore}/100`,
      status: fraudStatus,
      sub: fraudLabel,
      explanation: fraudScore < 20
        ? 'No significant fraud signals detected. Document authenticity verified.'
        : 'Some risk indicators found. Manual review recommended before investing.',
      progress: 100 - fraudScore, // invert: 0 fraud = 100% safe
    },
    {
      icon: <Layers className="w-3.5 h-3.5" />,
      label: 'Token Liquidity',
      value: `${liquidityIndex}/100`,
      status: liqStatus,
      explanation: liquidityIndex >= 80
        ? 'High liquidity — token is actively traded on the secondary marketplace.'
        : liquidityIndex >= 50
        ? 'Moderate liquidity — some delay expected when exiting your position.'
        : 'Low liquidity — this asset may be difficult to sell quickly.',
      progress: liquidityIndex,
    },
    {
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      label: 'Asset-Type Inherent Risk',
      value: `${assetRisk.riskPct}% risk`,
      status: assetRisk.status,
      explanation: assetRisk.label,
      progress: 100 - assetRisk.riskPct,
    },
    {
      icon: <Zap className="w-3.5 h-3.5" />,
      label: 'Overall Risk Tier',
      value: riskTier.replace('_', ' ').toUpperCase(),
      status: tierStatus,
      explanation: riskTier === 'low'
        ? 'Conservative risk profile — suitable for capital preservation goals.'
        : riskTier === 'medium'
        ? 'Balanced risk — moderate volatility with reasonable return potential.'
        : 'Elevated risk — higher return potential but greater capital exposure.',
    },
    ...(diversificationScore !== undefined ? [{
      icon: <PieChart className="w-3.5 h-3.5" />,
      label: 'Portfolio Diversification',
      value: `${diversificationScore}%`,
      status: (diversificationScore >= 70 ? 'positive' : diversificationScore >= 40 ? 'warning' : 'negative') as FactorStatus,
      explanation: diversificationScore >= 70
        ? 'Well diversified across multiple asset types — risk is spread effectively.'
        : 'Concentration risk detected. Consider adding different asset types.',
      progress: diversificationScore,
    }] : []),
  ];

  return (
    <ExplainPanel
      triggerLabel="Risk"
      title="Risk Breakdown"
      subtitle="Multi-factor risk assessment from platform data"
      factors={factors}
      score={`${Math.max(0, overallScore)}/100 Safety`}
      scoreColor={overallScore >= 70 ? 'text-emerald-400' : overallScore >= 40 ? 'text-amber-400' : 'text-red-400'}
      inline={inline}
      disclaimer="Risk scores are calculated from platform fraud detection, liquidity indices, and asset type benchmarks. They are not financial advice."
    />
  );
}
