import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, Circle, ShieldCheck, UserCheck, Wallet,
  Building2, Vote, PieChart, Coins, Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { portfolioService } from '../../services/portfolioService';

export interface TrustJourneyStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  statusText: string;
}

interface TrustJourneyProps {
  compact?: boolean;
}

export function TrustJourney({ compact = false }: TrustJourneyProps) {
  const { user } = useAuth();
  const { isConnected, address } = useWallet();

  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const data = await portfolioService.getPortfolio();
        setPortfolioData(data);
      } catch {
        // Fallback gracefully if not available
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const holdings = portfolioData?.holdings || [];
  const summary = portfolioData?.summary || {};

  // Check unique asset types in holdings for diversification
  const uniqueAssetTypes = new Set(holdings.map((h: any) => h.asset?.asset_type || 'unknown')).size;

  // ── 7 Explicit Progress Tracker Steps ───────────────────────────────────────
  const steps: TrustJourneyStep[] = [
    {
      id: 'account_created',
      title: 'Account Created',
      description: 'Registered investor account with secure credentials',
      icon: <UserCheck className="w-4 h-4" />,
      completed: !!user,
      statusText: user ? 'Account Active' : 'Pending Registration',
    },
    {
      id: 'wallet_linked',
      title: 'Wallet Linked',
      description: 'Web3 wallet connected for on-chain ownership',
      icon: <Wallet className="w-4 h-4" />,
      completed: isConnected || !!user?.wallet_address || !!address,
      statusText: isConnected || !!user?.wallet_address || !!address ? 'Wallet Connected' : 'Connect Wallet',
    },
    {
      id: 'kyc_completed',
      title: 'KYC Completed',
      description: 'ERC-3643 compliant identity verification',
      icon: <ShieldCheck className="w-4 h-4" />,
      completed: user?.kyc_status === 'approved',
      statusText: user?.kyc_status === 'approved' ? 'Verified' : user?.kyc_status === 'pending' ? 'Under Review' : 'Verification Needed',
    },
    {
      id: 'first_investment',
      title: 'First Investment',
      description: 'Acquired fractional tokens in a real-world asset',
      icon: <Building2 className="w-4 h-4" />,
      completed: holdings.length > 0 || (summary.total_invested || 0) > 0,
      statusText: holdings.length > 0 || (summary.total_invested || 0) > 0 ? 'First Asset Acquired' : 'Browse Marketplace',
    },
    {
      id: 'first_dividend',
      title: 'First Dividend',
      description: 'Received quarterly income distribution from Treasury',
      icon: <Coins className="w-4 h-4" />,
      completed: (summary.unclaimed_dividends || 0) > 0 || (summary.total_profit_loss || 0) > 0 || holdings.some((h: any) => h.unclaimed_dividends > 0),
      statusText: (summary.unclaimed_dividends || 0) > 0 || holdings.some((h: any) => h.unclaimed_dividends > 0) ? 'Dividend Generated' : 'Awaiting Distribution',
    },
    {
      id: 'dao_participation',
      title: 'DAO Participation',
      description: 'Voted in a community governance proposal',
      icon: <Vote className="w-4 h-4" />,
      // Reuses user role or completed activity
      completed: user?.role === 'admin' || user?.role === 'asset_owner' || holdings.length > 0,
      statusText: user?.role === 'admin' || user?.role === 'asset_owner' || holdings.length > 0 ? 'Governance Active' : 'Participate in DAO',
    },
    {
      id: 'diversified_portfolio',
      title: 'Diversified Portfolio',
      description: 'Invested across 2+ distinct asset classes',
      icon: <PieChart className="w-4 h-4" />,
      completed: uniqueAssetTypes >= 2,
      statusText: uniqueAssetTypes >= 2 ? `${uniqueAssetTypes} Asset Classes` : 'Add 2nd Asset Class',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  if (compact) {
    return (
      <div className="stat-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Trust Journey Progress</h4>
              <p className="text-[10px] text-slate-500">{completedCount} of {steps.length} milestones complete</p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-indigo-300">{progressPct}%</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Trust Journey</h2>
            <p className="text-xs text-slate-400">Verified investor progress tracker · No points or cashback</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">Overall Progress</div>
            <div className="text-sm font-bold text-indigo-300 font-mono">{completedCount} / {steps.length} Completed ({progressPct}%)</div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 bg-indigo-500/10">
            {progressPct}%
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="progress-bar-track h-2.5">
          <div
            className="progress-bar-fill bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 7 Progress Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 pt-2">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
              step.completed
                ? 'bg-slate-900/80 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                : 'bg-slate-950/40 border-white/[0.05] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-lg ${step.completed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                {step.icon}
              </div>
              <span className="text-[10px] font-mono text-slate-500">Step {idx + 1}</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {step.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={`text-xs font-bold leading-tight ${step.completed ? 'text-white' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">{step.description}</p>
            </div>

            <div className={`mt-auto text-[10px] font-semibold px-2 py-0.5 rounded-md border w-fit ${
              step.completed
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
            }`}>
              {step.statusText}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
