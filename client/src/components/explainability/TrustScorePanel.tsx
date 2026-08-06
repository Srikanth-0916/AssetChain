/**
 * TrustScorePanel — Fetches live trust score from /api/v1/trust/:assetId
 * and shows a full scored breakdown via ExplainPanel.
 *
 * Reuses 100% of the backend TrustScoreService calculation.
 * No new AI logic created.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ExplainPanel, type ExplainFactor } from './ExplainPanel';
import {
  Building2, Users, Brain, Scale, Activity, Layers, Gavel,
  ShieldCheck,
} from 'lucide-react';

import { API_BASE_URL as API_BASE } from '../../config/network';


interface TrustBreakdownItem {
  score: number;
  maxScore: number;
  status: string;
  detail: string;
}

interface TrustReport {
  trustScore: number;
  trustBadge: string;
  breakdown: {
    spvVerification: TrustBreakdownItem;
    multiSigApproval: TrustBreakdownItem;
    fraudDetection: TrustBreakdownItem;
    kycCompliance: TrustBreakdownItem;
    occupancyRate: TrustBreakdownItem;
    liquidityScore: TrustBreakdownItem;
    daoGovernance: TrustBreakdownItem;
  };
  disclaimer: string;
}

interface TrustScorePanelProps {
  assetId: string;
  /** If provided, shows trust score next to the trigger */
  showScore?: boolean;
  inline?: boolean;
}

function statusFromItem(item: TrustBreakdownItem): 'positive' | 'warning' | 'negative' | 'neutral' {
  const pct = item.score / item.maxScore;
  if (pct >= 1)    return 'positive';
  if (pct >= 0.5)  return 'warning';
  if (pct > 0)     return 'warning';
  return 'negative';
}

const ICONS: Record<string, React.ReactNode> = {
  spvVerification: <Building2 className="w-3.5 h-3.5" />,
  multiSigApproval: <Users className="w-3.5 h-3.5" />,
  fraudDetection: <Brain className="w-3.5 h-3.5" />,
  kycCompliance: <Scale className="w-3.5 h-3.5" />,
  occupancyRate: <Activity className="w-3.5 h-3.5" />,
  liquidityScore: <Layers className="w-3.5 h-3.5" />,
  daoGovernance: <Gavel className="w-3.5 h-3.5" />,
};

const LABELS: Record<string, string> = {
  spvVerification: 'SPV Legal Verification',
  multiSigApproval: 'Multi-Sig Approval (2-of-3)',
  fraudDetection: 'AI Fraud Detection',
  kycCompliance: 'KYC Compliance',
  occupancyRate: 'Occupancy Rate',
  liquidityScore: 'Token Liquidity',
  daoGovernance: 'DAO Governance',
};

export function TrustScorePanel({ assetId, showScore = true, inline = false }: TrustScorePanelProps) {
  const [report, setReport] = useState<TrustReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchReport = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/trust/${assetId}`);
      const json = await res.json();
      if (json.success) setReport(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); setFetched(true); }
  }, [assetId, fetched]);

  // Lazy-load: only fetch when panel is first opened
  if (!report && !loading && !fetched) {
    // noop — handled by onOpen
  }

  const factors: ExplainFactor[] = report
    ? (Object.entries(report.breakdown) as [string, TrustBreakdownItem][]).map(([key, item]) => ({
        icon: ICONS[key],
        label: LABELS[key] ?? key,
        value: `${item.score}/${item.maxScore} pts`,
        status: statusFromItem(item),
        explanation: `${item.status} — ${item.detail}`,
        progress: (item.score / item.maxScore) * 100,
      }))
    : [];

  // Placeholder factors while loading
  const loadingFactors: ExplainFactor[] = loading
    ? Object.keys(LABELS).map(key => ({
        icon: ICONS[key],
        label: LABELS[key],
        value: '—',
        status: 'neutral' as const,
        explanation: 'Loading trust data…',
        progress: 0,
      }))
    : [];

  return (
    <div
      onMouseEnter={fetchReport}
      onClick={fetchReport}
    >
      <ExplainPanel
        triggerLabel="Trust Score"
        title="Trust Score Breakdown"
        subtitle="Deterministic 7-factor score from live platform data"
        factors={report ? factors : loadingFactors}
        score={report ? `${report.trustScore}/100` : undefined}
        scoreColor={
          report
            ? report.trustScore >= 75 ? 'text-emerald-400'
            : report.trustScore >= 50 ? 'text-amber-400'
            : 'text-red-400'
            : 'text-slate-500'
        }
        disclaimer={report?.disclaimer}
        inline={inline}
        triggerClassName="gap-2"
      />
    </div>
  );
}
