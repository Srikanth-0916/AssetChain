import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Star, Gift, TrendingUp, Zap, Award, ChevronRight,
  Clock, CheckCircle, ArrowUpRight, Sparkles, ShieldCheck,
  Users, BarChart3, Calendar, Crown
} from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import api from '../services/api';

/* We will generate reward history dynamically from the activities API */

const REDEEM_OPTIONS = [
  {
    id: 'fee',
    icon: '💸',
    title: 'Lower Platform Fee',
    description: 'Reduce your platform fee by 0.5% for the next 3 investments',
    cost: 500,
    tag: 'Most Popular',
    tagColor: 'pill-info',
    available: true,
  },
  {
    id: 'report',
    icon: '📊',
    title: 'Premium AI Report',
    description: 'Unlock a deep-dive AI analysis of any asset of your choice',
    cost: 750,
    tag: 'High Value',
    tagColor: 'pill-success',
    available: true,
  },
  {
    id: 'access',
    icon: '🔓',
    title: 'Early Asset Access',
    description: 'Get 48-hour early access to newly listed tokenized assets',
    cost: 1000,
    tag: 'Exclusive',
    tagColor: 'pill-warning',
    available: true,
  },
  {
    id: 'support',
    icon: '⚡',
    title: 'Priority Support',
    description: 'Skip the queue with dedicated advisor support for 30 days',
    cost: 600,
    tag: null,
    tagColor: '',
    available: true,
  },
  {
    id: 'referral',
    icon: '🎁',
    title: 'Higher Referral Bonus',
    description: 'Boost your referral bonus to 500 points per friend for 60 days',
    cost: 800,
    tag: null,
    tagColor: '',
    available: true,
  },
  {
    id: 'webinar',
    icon: '🎓',
    title: 'Exclusive Webinar Access',
    description: 'Join private investor webinars with top real-estate experts',
    cost: 400,
    tag: null,
    tagColor: '',
    available: true,
  },
];

/* Level configuration */
const LEVELS = [
  { name: 'Explorer',         min: 0,    max: 500,   cls: 'level-explorer',  icon: '🌱' },
  { name: 'Investor',         min: 500,  max: 1500,  cls: 'level-investor',  icon: '📈' },
  { name: 'Silver Investor',  min: 1500, max: 3000,  cls: 'level-silver',    icon: '🥈' },
  { name: 'Gold Investor',    min: 3000, max: 6000,  cls: 'level-gold',      icon: '🥇' },
  { name: 'Platinum Investor',min: 6000, max: 10000, cls: 'level-platinum',  icon: '💎' },
  { name: 'TrustChain Elite', min: 10000,max: 99999, cls: 'level-elite',     icon: '👑' },
];

function getCurrentLevel(points: number) {
  return LEVELS.find(l => points >= l.min && points < l.max) ?? LEVELS[LEVELS.length - 1];
}

function getNextLevel(points: number) {
  const idx = LEVELS.findIndex(l => points >= l.min && points < l.max);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

function CircleProgress({ pct, size = 120, stroke = 8, children }: {
  pct: number; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#rg)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const CATEGORIES = ['All', 'Investment', 'KYC', 'Governance', 'Referral', 'Engagement', 'Profile'];

export function RewardsCenter() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [redeemTarget, setRedeemTarget] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function loadRewardsData() {
      if (!user) return;
      try {
        const [portfolio, activityRes] = await Promise.all([
          portfolioService.getPortfolio(),
          api.get('/activity', { params: { limit: 100 } }),
        ]);
        setPortfolioData(portfolio);
        setActivities(activityRes.data.data?.activities ?? []);
      } catch (err) {
        console.error('Failed to load rewards data:', err);
      }
    }
    loadRewardsData();
  }, [user?.id]);

  const totalInvested = portfolioData?.summary?.total_invested ?? 0;
  const kycPoints = user?.kyc_status === 'approved' ? 200 : 0;
  const investmentPoints = Math.round(totalInvested / 100);
  const votePoints = activities.filter(a => a.category === 'dao_vote').length * 50;
  
  const totalPoints = 100 + kycPoints + investmentPoints + votePoints;

  const dynamicHistory = [
    { id: 'profile', action: 'Profile Completed', points: 100, icon: '👤', date: user?.created_at?.split('T')[0] || '2026-08-01', category: 'profile' },
    ...(user?.kyc_status === 'approved' ? [{ id: 'kyc', action: 'KYC Verification Approved', points: 200, icon: '✅', date: '2026-08-01', category: 'kyc' }] : []),
    ...activities.filter(a => a.category === 'investment').map((a, i) => ({
      id: `inv-${i}`,
      action: a.title,
      points: Math.round(Number(a.metadata?.amount || 0) / 100) || 50,
      icon: '💰',
      date: a.timestamp.split('T')[0],
      category: 'investment'
    })),
    ...activities.filter(a => a.category === 'dao_vote').map((a, i) => ({
      id: `gov-${i}`,
      action: a.title,
      points: 50,
      icon: '🗳️',
      date: a.timestamp.split('T')[0],
      category: 'governance'
    }))
  ];

  const level    = getCurrentLevel(totalPoints);
  const nextLvl  = getNextLevel(totalPoints);
  const pctToNext = nextLvl
    ? Math.round(((totalPoints - level.min) / (nextLvl.min - level.min)) * 100)
    : 100;

  const filtered = activeFilter === 'All'
    ? dynamicHistory
    : dynamicHistory.filter(r => r.category === activeFilter.toLowerCase());

  function handleRedeem(id: string, cost: number) {
    if (totalPoints >= cost && !redeemed.includes(id)) {
      setRedeemed(prev => [...prev, id]);
      setRedeemTarget(null);
    }
  }

  return (
    <div className="page-container animate-fade-in">

      {/* ── Page Title ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Rewards Center</h1>
            <p className="text-sm text-slate-400">Earn points for every positive investing action</p>
          </div>
        </div>
      </div>

      {/* ── Hero: Points + Level ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Points Ring */}
        <div className="stat-card flex flex-col items-center gap-4 text-center">
          <CircleProgress pct={pctToNext} size={140} stroke={10}>
            <span className="text-3xl font-black gradient-text-gold">{totalPoints.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium mt-0.5">points</span>
          </CircleProgress>
          <div>
            <span className={`level-badge ${level.cls} text-base px-4 py-1.5`}>
              {level.icon} {level.name}
            </span>
            {nextLvl && (
              <p className="text-xs text-slate-500 mt-2">
                {(nextLvl.min - totalPoints).toLocaleString()} pts to <strong className="text-slate-300">{nextLvl.name}</strong>
              </p>
            )}
          </div>
          <div className="w-full progress-bar-track">
            <div className="progress-bar-fill progress-bar-fill-gold" style={{ width: `${pctToNext}%` }} />
          </div>
        </div>

        {/* Level Journey */}
        <div className="stat-card col-span-2">
          <p className="section-subheader mb-4">Level Journey</p>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {LEVELS.map((lv, i) => {
              const isCurrent  = lv.name === level.name;
              const isPast     = lv.min < level.min;
              const isNext     = !isPast && !isCurrent && i === LEVELS.findIndex(l => l.name === level.name) + 1;
              return (
                <div key={lv.name} className="flex items-center min-w-0">
                  <div className="flex flex-col items-center gap-1 px-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all
                      ${isPast    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : ''}
                      ${isCurrent ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-4 ring-indigo-500/15' : ''}
                      ${isNext    ? 'bg-slate-800 border-slate-600 text-slate-400' : ''}
                      ${!isPast && !isCurrent && !isNext ? 'bg-slate-900 border-slate-700/50 text-slate-600 opacity-40' : ''}
                    `}>
                      {isPast ? '✓' : lv.icon}
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap
                      ${isCurrent ? 'text-indigo-300' : isPast ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {lv.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-slate-600">{lv.min >= 1000 ? `${lv.min/1000}k` : lv.min}+</span>
                  </div>
                  {i < LEVELS.length - 1 && (
                    <div className={`h-0.5 flex-1 min-w-[24px] ${isPast ? 'bg-emerald-500/40' : 'bg-slate-700/40'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <hr className="divider mt-4 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Earned', value: '4,250', icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" /> },
              { label: 'Redeemed',     value: '1,000', icon: <Gift className="w-4 h-4 text-amber-400" /> },
              { label: 'Rank',         value: '#142',  icon: <Crown className="w-4 h-4 text-purple-400" /> },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">{s.icon}</div>
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How to Earn ── */}
      <div className="stat-card mb-8">
        <p className="section-header mb-5">
          <Zap className="w-4 h-4 text-amber-400" />
          How to Earn Points
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { action: 'First Investment',    pts: 500,  icon: '🚀' },
            { action: '₹10,000 Invested',    pts: 100,  icon: '💰' },
            { action: 'Verify KYC',          pts: 200,  icon: '✅' },
            { action: 'Complete Profile',    pts: 100,  icon: '👤' },
            { action: 'Vote in DAO',         pts: 50,   icon: '🗳️' },
            { action: 'Refer a Friend',      pts: 300,  icon: '🎁' },
            { action: 'Hold 6 Months',       pts: 500,  icon: '⏳' },
            { action: '₹1L Milestone',       pts: 1000, icon: '🏆' },
          ].map(e => (
            <div key={e.action} className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/60 rounded-xl p-3">
              <span className="text-2xl">{e.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white leading-tight">{e.action}</div>
                <div className="text-xs text-amber-400 font-bold mt-0.5">+{e.pts} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Redeem Options ── */}
      <div className="mb-8">
        <p className="section-header mb-5">
          <Gift className="w-4 h-4 text-indigo-400" />
          Redeem Your Points
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REDEEM_OPTIONS.map(opt => {
            const canAfford  = totalPoints >= opt.cost;
            const isRedeemed = redeemed.includes(opt.id);
            return (
              <div key={opt.id} className="reward-option-card relative">
                {opt.tag && (
                  <span className={`pill-badge ${opt.tagColor} absolute top-4 right-4`}>{opt.tag}</span>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{opt.title}</div>
                    <div className="text-xs text-amber-400 font-bold mt-0.5">{opt.cost.toLocaleString()} points</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                <button
                  disabled={!canAfford || isRedeemed}
                  onClick={() => handleRedeem(opt.id, opt.cost)}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-all
                    ${isRedeemed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : canAfford
                        ? 'btn-primary !py-2'
                        : 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                    }`}
                >
                  {isRedeemed ? '✓ Redeemed' : canAfford ? 'Redeem Now' : `Need ${(opt.cost - totalPoints).toLocaleString()} more pts`}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Points cannot be redeemed as cash — this keeps the platform compliant with financial regulations.
        </p>
      </div>

      {/* ── Reward History ── */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-5">
          <p className="section-header">
            <Clock className="w-4 h-4 text-slate-400" />
            Reward History
          </p>
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.slice(0,4).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`tab-item text-xs py-1.5 px-3 ${activeFilter === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {filtered.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0 group">
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{r.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{r.action}</div>
                  <div className="text-xs text-slate-500">{r.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-sm">+{r.points}</span>
                <span className="text-xs text-slate-600">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
