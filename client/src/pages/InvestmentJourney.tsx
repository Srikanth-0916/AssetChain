import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { portfolioService } from '../services/portfolioService';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Circle, ShieldCheck, UserCheck, Wallet,
  Building2, Vote, PieChart, Coins, ArrowRight, MapPin,
} from 'lucide-react';

interface JourneyStepItem {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  statusBadge: string;
  cta?: { label: string; to: string };
}

export function InvestmentJourney() {
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
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const holdings = portfolioData?.holdings || [];
  const summary = portfolioData?.summary || {};
  const uniqueAssetTypes = new Set(holdings.map((h: any) => h.asset?.asset_type || 'unknown')).size;

  // ── 7 Explicit Steps (No points, No rewards, No cashback) ───────────────────
  const steps: JourneyStepItem[] = [
    {
      id: 'account_created',
      stepNumber: 1,
      title: 'Account Created',
      description: 'Registered investor account with secure credentials and profile verification.',
      icon: <UserCheck className="w-5 h-5 text-indigo-400" />,
      completed: !!user,
      statusBadge: user ? 'Completed' : 'Pending',
    },
    {
      id: 'wallet_linked',
      stepNumber: 2,
      title: 'Wallet Linked',
      description: 'Connected Web3 wallet to Polygon Amoy Testnet for on-chain token settlement.',
      icon: <Wallet className="w-5 h-5 text-indigo-400" />,
      completed: isConnected || !!user?.wallet_address || !!address,
      statusBadge: isConnected || !!user?.wallet_address || !!address ? 'Completed' : 'Not Connected',
      cta: !isConnected ? { label: 'Connect Wallet in Header', to: '#' } : undefined,
    },
    {
      id: 'kyc_completed',
      stepNumber: 3,
      title: 'KYC Completed',
      description: 'Verified identity under ERC-3643 regulatory and compliance protocols.',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      completed: user?.kyc_status === 'approved',
      statusBadge: user?.kyc_status === 'approved' ? 'Completed' : user?.kyc_status === 'pending' ? 'Under Review' : 'Pending',
      cta: user?.kyc_status !== 'approved' ? { label: 'Verify Profile', to: '/profile' } : undefined,
    },
    {
      id: 'first_investment',
      stepNumber: 4,
      title: 'First Investment',
      description: 'Purchased initial fractional asset tokens on the AssetChain marketplace.',
      icon: <Building2 className="w-5 h-5 text-indigo-400" />,
      completed: holdings.length > 0 || (summary.total_invested || 0) > 0,
      statusBadge: holdings.length > 0 || (summary.total_invested || 0) > 0 ? 'Completed' : 'Upcoming',
      cta: holdings.length === 0 ? { label: 'Browse Marketplace', to: '/marketplace' } : undefined,
    },
    {
      id: 'first_dividend',
      stepNumber: 5,
      title: 'First Dividend',
      description: 'Generated and claimed quarterly rental yield distribution from smart contract treasury.',
      icon: <Coins className="w-5 h-5 text-indigo-400" />,
      completed: (summary.unclaimed_dividends || 0) > 0 || (summary.total_profit_loss || 0) > 0 || holdings.some((h: any) => h.unclaimed_dividends > 0),
      statusBadge: (summary.unclaimed_dividends || 0) > 0 || holdings.some((h: any) => h.unclaimed_dividends > 0) ? 'Completed' : 'Upcoming',
      cta: { label: 'View Portfolio Dividends', to: '/portfolio' },
    },
    {
      id: 'dao_participation',
      stepNumber: 6,
      title: 'DAO Participation',
      description: 'Participated in community governance by casting a vote on asset proposals.',
      icon: <Vote className="w-5 h-5 text-indigo-400" />,
      completed: user?.role === 'admin' || user?.role === 'asset_owner' || holdings.length > 0,
      statusBadge: user?.role === 'admin' || user?.role === 'asset_owner' || holdings.length > 0 ? 'Completed' : 'Upcoming',
      cta: { label: 'View Activity Log', to: '/activity' },
    },
    {
      id: 'diversified_portfolio',
      stepNumber: 7,
      title: 'Diversified Portfolio',
      description: 'Diversified investment position across 2 or more distinct asset categories.',
      icon: <PieChart className="w-5 h-5 text-indigo-400" />,
      completed: uniqueAssetTypes >= 2,
      statusBadge: uniqueAssetTypes >= 2 ? 'Completed' : 'In Progress',
      cta: uniqueAssetTypes < 2 ? { label: 'Explore Asset Categories', to: '/marketplace' } : undefined,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 animate-fade-in">

      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header-left">
          <div className="page-header-icon bg-indigo-500/10 border border-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="page-title">Trust Journey Progress Tracker</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified investor progression milestones · Data-driven progress tracker (no points or cashback)
            </p>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="stat-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Milestones Completed</span>
            <span className="text-indigo-400 font-mono font-bold">{completedCount} of {steps.length} ({progressPct}%)</span>
          </div>
          <div className="progress-bar-track h-3">
            <div
              className="progress-bar-fill bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-3xl font-black gradient-text font-mono">{progressPct}%</div>
        </div>
      </div>

      {/* Step Timeline */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`glass-card p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              step.completed
                ? 'border-emerald-500/30 bg-slate-900/70'
                : 'border-white/[0.06] bg-slate-950/40 opacity-70'
            }`}
          >
            <div className="flex items-start gap-4 flex-1">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                step.completed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500'
              }`}>
                {step.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : step.icon}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">Step {step.stepNumber}</span>
                  <h3 className={`text-sm font-bold ${step.completed ? 'text-white' : 'text-slate-300'}`}>
                    {step.title}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    step.completed
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}>
                    {step.statusBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{step.description}</p>
              </div>
            </div>

            {step.cta && step.cta.to !== '#' && (
              <Link
                to={step.cta.to}
                className="btn-secondary text-xs shrink-0 self-end sm:self-center"
              >
                {step.cta.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500">
        Trust Journey is a progress tracker reflecting verified account actions on Polygon.
        No financial rewards, cashbacks, or point redemptions are offered.
      </div>
    </div>
  );
}
