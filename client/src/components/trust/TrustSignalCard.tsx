/**
 * TrustSignalCard — Displays trust score and verification signals on asset pages.
 *
 * Fetches trust data from GET /api/v1/trust/:assetId and renders:
 *   - Overall Trust Score (0-100) with colored badge
 *   - Score breakdown per dimension
 *   - Verification timeline
 *   - Security status chips
 */

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, Shield, ShieldAlert, CheckCircle2, Clock,
  AlertTriangle, ChevronDown, ChevronUp, ExternalLink,
  Building2, Users, Brain, Scale, Activity, Gavel, Layers
} from 'lucide-react';

interface TrustBreakdownItem {
  score: number;
  maxScore: number;
  status: string;
  detail: string;
}

interface VerificationStep {
  step: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp?: string;
  detail: string;
  actor?: string;
}

interface TrustReport {
  assetId: string;
  assetTitle: string;
  trustScore: number;
  trustBadge: 'Verified' | 'Partially Verified' | 'Pending Verification';
  breakdown: {
    spvVerification: TrustBreakdownItem;
    multiSigApproval: TrustBreakdownItem;
    fraudDetection: TrustBreakdownItem;
    kycCompliance: TrustBreakdownItem;
    occupancyRate: TrustBreakdownItem;
    liquidityScore: TrustBreakdownItem;
    daoGovernance: TrustBreakdownItem;
  };
  verificationTimeline: VerificationStep[];
  calculatedAt: string;
  disclaimer: string;
}

interface TrustSignalCardProps {
  assetId: string;
  compact?: boolean;
}

const BADGE_CONFIG = {
  'Verified': {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    scoreColor: 'text-emerald-400',
  },
  'Partially Verified': {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    scoreColor: 'text-amber-400',
  },
  'Pending Verification': {
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    scoreColor: 'text-gray-400',
  },
};

const BREAKDOWN_ICONS: Record<string, React.ReactNode> = {
  spvVerification: <Building2 className="w-3.5 h-3.5" />,
  multiSigApproval: <Users className="w-3.5 h-3.5" />,
  fraudDetection: <Brain className="w-3.5 h-3.5" />,
  kycCompliance: <Scale className="w-3.5 h-3.5" />,
  occupancyRate: <Activity className="w-3.5 h-3.5" />,
  liquidityScore: <Layers className="w-3.5 h-3.5" />,
  daoGovernance: <Gavel className="w-3.5 h-3.5" />,
};

const BREAKDOWN_LABELS: Record<string, string> = {
  spvVerification: 'SPV Legal',
  multiSigApproval: 'Multi-Sig',
  fraudDetection: 'Fraud Check',
  kycCompliance: 'KYC Compliance',
  occupancyRate: 'Occupancy',
  liquidityScore: 'Liquidity',
  daoGovernance: 'DAO',
};

import { API_BASE_URL as API_BASE } from '../../config/network';


export function TrustSignalCard({ assetId, compact = false }: TrustSignalCardProps) {
  const [report, setReport] = useState<TrustReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const fetchTrustScore = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/trust/${assetId}`);
        if (!response.ok) {
          throw new Error('Trust score data unavailable');
        }
        const data = await response.json();
        setReport(data.data);
      } catch (err: any) {
        setError('Data unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchTrustScore();
  }, [assetId]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
        <div className="h-8 bg-gray-800 rounded w-1/4 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-2/3" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-sm">Trust score data unavailable</span>
        </div>
      </div>
    );
  }

  const badge = BADGE_CONFIG[report.trustBadge];
  const breakdownEntries = Object.entries(report.breakdown) as [string, TrustBreakdownItem][];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${badge.bg} ${badge.border} ${badge.color}`}>
        {badge.icon}
        <span>{report.trustBadge}</span>
        <span className={`font-bold ${badge.scoreColor}`}>{report.trustScore}/100</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`p-5 border-b border-gray-800 ${badge.bg}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${badge.border} ${badge.color}`}>
              {badge.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${badge.scoreColor}`}>{report.trustScore}</span>
                <span className="text-gray-500 text-sm">/ 100</span>
              </div>
              <span className={`text-sm font-medium ${badge.color}`}>{report.trustBadge}</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-32">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  report.trustScore >= 75 ? 'bg-emerald-500' :
                  report.trustScore >= 50 ? 'bg-amber-500' : 'bg-gray-500'
                }`}
                style={{ width: `${report.trustScore}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {new Date(report.calculatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-4">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-300 mb-3 hover:text-white transition-colors"
        >
          <span>Score Breakdown</span>
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Mini breakdown (always visible) */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {breakdownEntries.map(([key, item]) => (
            <div key={key} className="text-center">
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                {BREAKDOWN_ICONS[key]}
              </div>
              <div className={`text-sm font-bold ${item.score === item.maxScore ? 'text-emerald-400' : item.score > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                {item.score}/{item.maxScore}
              </div>
              <div className="text-xs text-gray-600 truncate">{BREAKDOWN_LABELS[key]}</div>
            </div>
          ))}
        </div>

        {/* Expanded breakdown */}
        {showBreakdown && (
          <div className="space-y-2 mt-3 border-t border-gray-800 pt-3">
            {breakdownEntries.map(([key, item]) => (
              <div key={key} className="flex items-start gap-2">
                <div className={`mt-0.5 ${item.score === item.maxScore ? 'text-emerald-400' : item.score > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                  {BREAKDOWN_ICONS[key]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-300">{BREAKDOWN_LABELS[key]}</span>
                    <span className="text-xs text-gray-400">{item.score}/{item.maxScore} pts</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${item.score === item.maxScore ? 'bg-emerald-500' : item.score > 0 ? 'bg-amber-500' : 'bg-gray-700'}`}
                      style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Timeline */}
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <span>Verification Timeline</span>
          {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTimeline && (
          <div className="mt-3 space-y-3">
            {report.verificationTimeline.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`p-1 rounded-full flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-emerald-500/20' :
                    step.status === 'failed' ? 'bg-red-500/20' : 'bg-gray-800'
                  }`}>
                    {step.status === 'completed'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      : step.status === 'failed'
                      ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      : <Clock className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                  {index < report.verificationTimeline.length - 1 && (
                    <div className="w-px flex-1 bg-gray-800 my-1" />
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      step.status === 'completed' ? 'text-white' : 'text-gray-500'
                    }`}>{step.step}</span>
                    {step.timestamp && (
                      <span className="text-xs text-gray-600">
                        {new Date(step.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{step.detail}</p>
                  {step.actor && (
                    <p className="text-xs text-gray-700 mt-0.5">By: {step.actor}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-4 text-xs text-gray-600">
        {report.disclaimer}
      </div>
    </div>
  );
}
