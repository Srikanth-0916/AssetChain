import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Circle, Lock, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Milestone {
  id: string;
  icon: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  date?: string;
  points?: number;
  cta?: { label: string; to: string };
}

const MILESTONES: Milestone[] = [
  {
    id: 'account',
    icon: '👤',
    title: 'Account Created',
    description: 'You joined AssetChain — the first step into tokenized real-world asset investing.',
    status: 'completed',
    date: '27 Nov 2024',
    points: 0,
  },
  {
    id: 'kyc',
    icon: '✅',
    title: 'Identity Verified (KYC)',
    description: 'Your identity has been verified, unlocking full investment capabilities.',
    status: 'completed',
    date: '28 Nov 2024',
    points: 200,
  },
  {
    id: 'wallet',
    icon: '🔗',
    title: 'Wallet Connected',
    description: 'Linked your Web3 wallet to enable on-chain token ownership and transfers.',
    status: 'completed',
    date: '30 Nov 2024',
    points: 75,
  },
  {
    id: 'first_invest',
    icon: '🚀',
    title: 'First Investment Made',
    description: 'Invested ₹10,000 in Green Valley Property Token — your portfolio has begun.',
    status: 'completed',
    date: '01 Dec 2024',
    points: 500,
  },
  {
    id: 'portfolio_build',
    icon: '📊',
    title: 'Portfolio Diversified',
    description: 'Own tokens in 3+ different asset sectors — real estate, agriculture, and commercial.',
    status: 'completed',
    date: '10 Jan 2025',
    points: 300,
  },
  {
    id: 'rental_income',
    icon: '💸',
    title: 'First Rental Income Received',
    description: 'Your investments started generating real income — ₹2,450 received.',
    status: 'completed',
    date: '20 Jan 2025',
    points: 0,
  },
  {
    id: 'dao',
    icon: '🗳️',
    title: 'DAO Member — First Vote',
    description: 'Participated in platform governance by casting your first DAO vote.',
    status: 'completed',
    date: '18 Jan 2025',
    points: 50,
  },
  {
    id: 'long_term',
    icon: '⏳',
    title: 'Long-Term Investor',
    description: 'Hold any asset token for 6 consecutive months — you\'re 4 months in.',
    status: 'current',
    points: 500,
    cta: { label: 'View Portfolio', to: '/portfolio' },
  },
  {
    id: 'lakh',
    icon: '🏆',
    title: '₹5L Portfolio Milestone',
    description: 'Grow your total portfolio value to ₹5,00,000 — currently at ₹2,45,000.',
    status: 'upcoming',
    points: 1000,
    cta: { label: 'Browse Assets', to: '/marketplace' },
  },
  {
    id: 'governance_veteran',
    icon: '⚖️',
    title: 'Governance Veteran',
    description: 'Vote in 10 DAO proposals — you\'ve voted in 2 so far.',
    status: 'upcoming',
    points: 500,
    cta: { label: 'View DAO', to: '/marketplace' },
  },
  {
    id: 'platinum',
    icon: '💎',
    title: 'Platinum Investor Status',
    description: 'Earn 6,000 reward points to unlock Platinum level with premium perks.',
    status: 'locked',
    points: 0,
  },
  {
    id: 'elite',
    icon: '👑',
    title: 'TrustChain Elite',
    description: 'The highest investor rank on AssetChain — earn 10,000 total reward points.',
    status: 'locked',
    points: 0,
  },
];

const STATUS_CONFIG = {
  completed: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/15', icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, connectorClass: 'completed' },
  current:   { border: 'border-indigo-500',     bg: 'bg-indigo-500/15',  icon: <div className="w-5 h-5 rounded-full border-2 border-indigo-400 bg-indigo-400/30 animate-pulse" />, connectorClass: '' },
  upcoming:  { border: 'border-slate-600/50',   bg: 'bg-slate-800/40',   icon: <Circle className="w-5 h-5 text-slate-600" />, connectorClass: '' },
  locked:    { border: 'border-slate-700/40',   bg: 'bg-slate-900/30',   icon: <Lock className="w-4 h-4 text-slate-700" />, connectorClass: '' },
};

export function InvestmentJourney() {
  const { user } = useAuth();
  const completed = MILESTONES.filter(m => m.status === 'completed').length;
  const pct = Math.round((completed / MILESTONES.length) * 100);

  return (
    <div className="page-container-sm animate-fade-in">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🗺️</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Your Investment Journey</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Every great investor follows a path. Here's yours — from day one to TrustChain Elite.
        </p>
      </div>

      {/* Progress bar */}
      <div className="stat-card mb-10 flex items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Journey Progress</span>
            <span className="text-sm font-bold text-indigo-400">{completed} / {MILESTONES.length} Milestones</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="text-3xl font-black gradient-text shrink-0">{pct}%</div>
      </div>

      {/* Milestone timeline */}
      <div className="space-y-0">
        {MILESTONES.map((m, i) => {
          const cfg = STATUS_CONFIG[m.status];
          const isLast = i === MILESTONES.length - 1;
          return (
            <div key={m.id} className="journey-milestone">
              {/* Connector */}
              {!isLast && (
                <div className={`journey-milestone-connector ${m.status === 'completed' ? 'completed' : ''}`} />
              )}

              {/* Step dot */}
              <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 z-10 mt-1`}>
                {m.status === 'locked' || m.status === 'upcoming' || m.status === 'current'
                  ? <span className="text-lg">{m.icon}</span>
                  : cfg.icon
                }
              </div>

              {/* Content */}
              <div className={`flex-1 pb-8 ${isLast ? 'pb-0' : ''}`}>
                <div className={`glass-card p-5 ${m.status === 'current' ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10' : ''}
                  ${m.status === 'locked' ? 'opacity-45' : ''}
                `}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{m.title}</span>
                        {m.status === 'current' && (
                          <span className="pill-badge pill-info text-xs animate-pulse">In Progress</span>
                        )}
                        {m.status === 'completed' && (
                          <span className="pill-badge pill-success text-xs">✓ Done</span>
                        )}
                        {m.status === 'locked' && (
                          <span className="pill-badge pill-neutral text-xs">Locked</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                      {m.date && (
                        <p className="text-xs text-slate-600 mt-2">Completed on {m.date}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {(m.points ?? 0) > 0 && (
                        <div className={`text-sm font-bold ${m.status === 'completed' ? 'text-amber-400' : 'text-slate-500'}`}>
                          {m.status === 'completed' ? `+${m.points}` : `${m.points}`} pts
                        </div>
                      )}
                    </div>
                  </div>
                  {m.cta && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60">
                      <Link to={m.cta.to} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                        {m.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <p className="text-slate-500 text-sm mb-4">Keep investing to unlock the next milestone</p>
        <Link to="/marketplace" className="btn-primary">
          Browse Assets <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
