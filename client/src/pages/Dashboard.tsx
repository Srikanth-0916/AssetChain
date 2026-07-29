import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Building2, ShieldAlert, Wallet, Coins, ArrowUpRight,
  Vote, PlusCircle, FileCheck2, Sparkles, Star, Heart, Activity,
  Trophy, ChevronRight, ArrowRight, BarChart3, Receipt, Map, Shield
} from 'lucide-react';
import { formatCurrency, truncateAddress } from '../lib/utils';
import { ContextualAITip } from '../components/trust/ContextualAITip';
import { TrustJourney } from '../components/trust/TrustJourney';

/* Recent Activity feed data */
const RECENT_ACTIVITY = [
  { id: 1, icon: '💸', title: 'Rental Income Received',  subtitle: 'Green Valley Property Token',  amount: '+₹2,450',  positive: true,  time: 'Today, 10:32 AM' },
  { id: 2, icon: '🗳️', title: 'DAO Vote Completed',       subtitle: 'Proposal #47 — Fee Structure', amount: '',          positive: true,  time: 'Yesterday' },
  { id: 3, icon: '✅', title: 'Investment Confirmed',     subtitle: 'TechHub Commercial Complex',    amount: '-₹25,000', positive: false, time: 'Yesterday, 2:10 PM' },
];

const TRUST_SCORE = 92;
const REWARDS_PTS = 3250;
const PORTFOLIO_HEALTH = 88;

function HealthBar({ value, color = 'from-indigo-600 to-emerald-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full progress-bar-track">
      <div
        className={`progress-bar-fill bg-gradient-to-r ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { isConnected, address, connect } = useWallet();

  const isInvestor = user?.role === 'investor';
  const isOwner    = user?.role === 'asset_owner';
  const isAdmin    = user?.role === 'admin';

  const firstName = user?.full_name?.split(' ')[0] ?? 'Investor';

  return (
    <div className="page-container space-y-6 animate-fade-in">

      {/* ──────────────────────────────────────────────
          HERO — Greeting + Core Stats
      ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-indigo-500/20"
        style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(15,23,42,0.9) 60%)' }}>
        {/* Background glow */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="level-badge level-gold text-sm">🥇 Gold Investor</span>
              <span className="pill-badge pill-success">Active</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
              Hello, {firstName} 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              {isInvestor && 'Your portfolio is performing well. Here\'s how your investments are doing today.'}
              {isOwner    && 'Manage your tokenized assets, track funding, and review investor activity.'}
              {isAdmin    && 'Platform overview — KYC queue, compliance metrics, and network health.'}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {isInvestor && <>
              <Link to="/marketplace"  className="btn-primary text-sm"><Coins className="w-4 h-4" /> Browse Assets</Link>
              <Link to="/ai-copilot"   className="btn-secondary text-sm"><Sparkles className="w-4 h-4" /> AI Advisor</Link>
            </>}
            {isOwner && <Link to="/assets/create" className="btn-primary text-sm"><PlusCircle className="w-4 h-4" /> Register Asset</Link>}
            {isAdmin && <Link to="/admin" className="btn-primary text-sm"><FileCheck2 className="w-4 h-4" /> Admin Panel</Link>}
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {user?.kyc_status !== 'approved' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span><strong>KYC Pending</strong> — Complete identity verification to invest and claim yields.</span>
          </div>
          <Link to="/profile" className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-500/30 transition-all shrink-0">
            Verify Now
          </Link>
        </div>
      )}

      {!isConnected && (
        <div className="p-4 rounded-2xl bg-indigo-500/8 border border-indigo-500/20 text-indigo-300 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-400 shrink-0" />
            <span><strong>Wallet Disconnected</strong> — Connect MetaMask to interact with on-chain contracts.</span>
          </div>
          <button onClick={() => connect()} className="btn-secondary text-xs py-1.5 px-3 shrink-0">Connect Wallet</button>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          5 STAT CARDS
      ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">

        {/* Portfolio Value */}
        <div className="stat-card col-span-2 lg:col-span-2 animate-slide-up">
          <p className="section-subheader mb-2">Portfolio Value</p>
          <div className="text-3xl font-black text-white mb-1">{formatCurrency(isOwner ? 1250000 : 245000)}</div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+₹2,450 (+1.01%) today</span>
          </div>
          <div className="mt-3">
            <HealthBar value={PORTFOLIO_HEALTH} />
            <div className="text-xs text-slate-500 mt-1">Portfolio Health: {PORTFOLIO_HEALTH}/100</div>
          </div>
        </div>

        {/* Trust Level */}
        <div className="stat-card animate-slide-up">
          <p className="section-subheader mb-2">Trust Level</p>
          <div className="text-2xl mb-1">🥇</div>
          <div className="font-bold text-amber-400 text-sm">Gold Investor</div>
          <div className="text-xs text-slate-500 mt-1">1,750 pts to Platinum</div>
          <div className="mt-3">
            <HealthBar value={54} color="from-amber-500 to-amber-400" />
          </div>
        </div>

        {/* Rewards */}
        <div className="stat-card animate-slide-up">
          <p className="section-subheader mb-2">Reward Points</p>
          <div className="text-3xl font-black gradient-text-gold">{REWARDS_PTS.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Available to redeem</div>
          <Link to="/rewards" className="text-xs text-indigo-400 font-semibold flex items-center gap-1 mt-3 hover:text-indigo-300 transition-colors">
            Redeem <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Trust Score */}
        <div className="stat-card animate-slide-up">
          <p className="section-subheader mb-2">Trust Score</p>
          <div className="text-3xl font-black gradient-text">{TRUST_SCORE}</div>
          <div className="text-xs text-emerald-400 font-medium mt-1">Excellent</div>
          <div className="mt-3">
            <HealthBar value={TRUST_SCORE} />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          AI INSIGHT + QUICK ACTIONS (2-col)
      ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AI Insight panel */}
        <div className="lg:col-span-2">
          <ContextualAITip
            title="AI Portfolio Insight"
            message="You have idle capital available. Based on your Gold Investor profile (medium risk, ₹10,000+ ticket size), Healthcare REIT and Agri-Solar hybrid assets may improve your portfolio diversification by ~18%."
            actionText="View Recommendation"
            actionHref="/ai-copilot"
          />
        </div>

        {/* Quick Actions */}
        <div className="stat-card">
          <p className="section-header mb-4"><Sparkles className="w-4 h-4 text-indigo-400" /> Quick Actions</p>
          <div className="space-y-2">
            {[
              { icon: <Coins className="w-4 h-4" />,    label: 'Browse Assets',       to: '/marketplace',   color: 'text-indigo-400 bg-indigo-500/10' },
              { icon: <Sparkles className="w-4 h-4" />, label: 'AI Recommendation',   to: '/ai-copilot',    color: 'text-purple-400 bg-purple-500/10' },
              { icon: <BarChart3 className="w-4 h-4" />, label: 'My Portfolio',        to: '/portfolio',     color: 'text-emerald-400 bg-emerald-500/10' },
              { icon: <Star className="w-4 h-4" />,     label: 'Rewards Center',      to: '/rewards',       color: 'text-amber-400 bg-amber-500/10' },
              { icon: <Map className="w-4 h-4" />,      label: 'Investment Journey',  to: '/journey',       color: 'text-cyan-400 bg-cyan-500/10' },
              { icon: <Receipt className="w-4 h-4" />,  label: 'Transactions',         to: '/transactions',  color: 'text-slate-400 bg-slate-700/30' },
            ].map(qa => (
              <Link
                key={qa.to}
                to={qa.to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${qa.color}`}>
                  {qa.icon}
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{qa.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          RECENT ACTIVITY + TRUST JOURNEY (2-col)
      ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-3 stat-card">
          <div className="flex items-center justify-between mb-5">
            <p className="section-header"><Activity className="w-4 h-4 text-indigo-400" /> Recent Activity</p>
            <Link to="/activity" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            {RECENT_ACTIVITY.map(ev => (
              <div key={ev.id} className="flex items-center gap-4 py-3 border-b border-slate-800/60 last:border-0 group cursor-default">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-lg shrink-0">
                  {ev.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{ev.title}</div>
                  <div className="text-xs text-slate-500 truncate">{ev.subtitle}</div>
                </div>
                <div className="text-right shrink-0">
                  {ev.amount && (
                    <div className={`text-sm font-bold ${ev.positive ? 'text-emerald-400' : 'text-red-400'}`}>{ev.amount}</div>
                  )}
                  <div className="text-xs text-slate-600">{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/activity" className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-800/60 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-xs text-slate-500 hover:text-indigo-400 transition-all">
            View complete activity timeline <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Achievements Mini */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-header"><Trophy className="w-4 h-4 text-amber-400" /> Achievements</p>
            <Link to="/achievements" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">8 / 16 Unlocked</span>
              <span className="text-xs font-bold text-indigo-400">50%</span>
            </div>
            <HealthBar value={50} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['🚀','✅','👤','🔗','💰','🗳️','🎁','🥇'].map((em, i) => (
              <div key={i} className="w-full aspect-square rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer">
                {em}
              </div>
            ))}
          </div>
          <Link to="/achievements" className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-800/60 hover:border-amber-500/30 hover:bg-amber-500/5 text-xs text-slate-500 hover:text-amber-400 transition-all">
            View all achievements <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Trust Journey ── */}
      <TrustJourney completedSteps={['account', 'kyc', 'first_inv', 'diversified', 'rental']} />

    </div>
  );
}
