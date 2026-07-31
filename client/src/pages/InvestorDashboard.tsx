import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp, Coins, ShieldCheck, Wallet, ArrowUpRight,
  PieChart, BarChart3, Clock, AlertTriangle, Layers, Building2,
  Sparkles, CheckCircle2, ChevronRight, MessageSquare, Download
} from 'lucide-react';

export function InvestorDashboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y' | 'ALL'>('1M');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Verified Investor Workspace
            </span>
            <span className="text-xs text-slate-400">• Polygon Amoy Connected</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.full_name || 'Investor'} 👋
          </h1>
          <p className="text-xs text-slate-400">
            Real-time portfolio performance, dividend payouts, and AI RWA intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/marketplace"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Building2 className="w-4 h-4" /> Browse RWA Marketplace
          </Link>
          <Link
            to="/ai-copilot"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" /> Ask AI Advisor
          </Link>
        </div>
      </div>

      {/* ── Zerodha-Style Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Portfolio Net Worth</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">₹24,53,000</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +9.02% Total ROI (₹2,03,000)
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Annualized Yield & Income</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">₹2,04,826 / yr</div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <span>Weighted Yield: 8.35% p.a.</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Projected Portfolio CAGR</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">12.18% CAGR</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>3-Year Exit Liquidity Window</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Trust & Compliance</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">82 / 100</div>
          <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ERC-3643 KYC Whitelisted
          </div>
        </div>
      </div>

      {/* ── Asset Allocation & Holdings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Active RWA Holdings
            </h2>
            <Link to="/portfolio" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All Holdings <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card p-0 border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-800/60">
              <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">BKC Prime Commercial Tower</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold">Commercial</span>
                  </div>
                  <div className="text-xs text-slate-400">Mumbai, MH · 100 Tokens Owned (10% SPV Share)</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">₹10,00,000</div>
                  <div className="text-xs text-emerald-400 font-semibold">+8.5% Yield</div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Pavagada 50MW Solar Array</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-semibold">Clean Energy</span>
                  </div>
                  <div className="text-xs text-slate-400">Tumkur, KA · 150 Tokens Owned (15% SPV Share)</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">₹7,50,000</div>
                  <div className="text-xs text-emerald-400 font-semibold">+9.8% Yield</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & AI Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> AI Portfolio Insights
          </h2>
          <div className="glass-card p-5 space-y-4 border-slate-800 bg-slate-900/60">
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
              💡 <strong>Diversification Recommendation:</strong> Your portfolio has 58% exposure to commercial office space. Consider adding clean energy tokens to optimize risk-adjusted returns.
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400">Quick Navigation</div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/activity" className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 text-center transition-colors">
                  Activity Timeline
                </Link>
                <Link to="/transactions" className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 text-center transition-colors">
                  Transactions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
