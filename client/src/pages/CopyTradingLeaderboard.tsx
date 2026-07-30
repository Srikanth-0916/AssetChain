import React, { useState } from 'react';
import {
  Trophy, TrendingUp, Users, ArrowUpRight, CheckCircle2,
  Copy, Star, Award, ShieldCheck, Zap
} from 'lucide-react';

interface LeaderboardInvestor {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  roleBadge: string;
  roiPct: number;
  totalVolume: string;
  copiersCount: number;
  trustScore: number;
  topHoldings: string[];
}

const LEADERBOARD_DATA: LeaderboardInvestor[] = [
  {
    rank: 1,
    id: 'inv_1',
    name: 'Elena Rostova (Institutional Real Estate)',
    avatar: '👩‍💼',
    roleBadge: 'Verified SPV Lead',
    roiPct: 34.2,
    totalVolume: '₹14.2M',
    copiersCount: 1420,
    trustScore: 98,
    topHoldings: ['Green Valley Commercial', 'TechHub Innovation', 'AgriTech Solar'],
  },
  {
    rank: 2,
    id: 'inv_2',
    name: 'Marcus Vance (Renewable Yield Fund)',
    avatar: '👨‍💼',
    roleBadge: 'Accredited Investor',
    roiPct: 28.6,
    totalVolume: '₹9.8M',
    copiersCount: 980,
    trustScore: 96,
    topHoldings: ['AgriTech Solar Farm Alpha', 'HydroPower REIT'],
  },
  {
    rank: 3,
    id: 'inv_3',
    name: 'Aarav Mehta (PropTech Ventures)',
    avatar: '👨‍💻',
    roleBadge: 'Top Allocator',
    roiPct: 24.1,
    totalVolume: '₹6.5M',
    copiersCount: 650,
    trustScore: 94,
    topHoldings: ['TechHub Commercial', 'Green Residency Block'],
  },
  {
    rank: 4,
    id: 'inv_4',
    name: 'Sophia Chen (Global RWA Capital)',
    avatar: '👩‍🔬',
    roleBadge: 'Accredited Investor',
    roiPct: 21.8,
    totalVolume: '₹4.2M',
    copiersCount: 410,
    trustScore: 92,
    topHoldings: ['Green Valley Property', 'Solar Farm Alpha 1'],
  },
];

export function CopyTradingLeaderboard() {
  const [selectedInvestor, setSelectedInvestor] = useState<LeaderboardInvestor | null>(null);
  const [copyAmount, setCopyAmount] = useState<number>(10000);
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

  const handleExecuteCopyTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor) return;
    setCopiedSuccess(`🎉 Successfully copying ${selectedInvestor.name}'s portfolio allocation with ₹${copyAmount.toLocaleString()} capital! Transaction settled on Polygon Amoy.`);
    setTimeout(() => {
      setCopiedSuccess(null);
      setSelectedInvestor(null);
    }, 4000);
  };

  return (
    <div className="page-container animate-fade-in space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-600/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">1-Click Portfolio Copy-Trading</h1>
            <p className="text-sm text-slate-400">Replicate top-performing accredited investor asset allocations automatically</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300">
          <Users className="w-3.5 h-3.5" /> 3,460 Active Copiers
        </div>
      </div>

      {/* Success Notification */}
      {copiedSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1">{copiedSuccess}</span>
        </div>
      )}

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LEADERBOARD_DATA.map((investor) => (
          <div
            key={investor.id}
            className="stat-card p-6 space-y-5 hover:border-indigo-500/40 transition-all group"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                  {investor.avatar}
                </div>
                <div>
                  <div className="font-bold text-white text-base flex items-center gap-2">
                    {investor.name}
                    <span className="text-xs text-amber-400">#{investor.rank}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 text-[10px] font-semibold">
                      {investor.roleBadge}
                    </span>
                    <span>· Trust Score: <strong className="text-emerald-400">{investor.trustScore}/100</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">30D Return</div>
                <div className="text-lg font-black text-emerald-400 font-mono">+{investor.roiPct}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Volume</div>
                <div className="text-lg font-black text-white font-mono">{investor.totalVolume}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Copiers</div>
                <div className="text-lg font-black text-indigo-400 font-mono">{investor.copiersCount}</div>
              </div>
            </div>

            {/* Holdings Tags */}
            <div>
              <div className="text-[11px] text-slate-400 font-semibold mb-1.5">Top Asset Holdings:</div>
              <div className="flex flex-wrap gap-1.5">
                {investor.topHoldings.map(h => (
                  <span key={h} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => setSelectedInvestor(investor)}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Copy className="w-3.5 h-3.5" /> Copy {investor.name.split(' ')[0]}'s Allocation
            </button>
          </div>
        ))}
      </div>

      {/* Copy Trade Modal */}
      {selectedInvestor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedInvestor(null)}
        >
          <div
            className="glass-card p-8 max-w-md w-full animate-fade-scale space-y-5 border border-indigo-500/30 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
                {selectedInvestor.avatar}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Copy {selectedInvestor.name}</h3>
                <p className="text-xs text-slate-400">Replicate allocation across top RWA tokens</p>
              </div>
            </div>

            <form onSubmit={handleExecuteCopyTrade} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Investment Capital (INR)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={copyAmount}
                  onChange={(e) => setCopyAmount(Number(e.target.value))}
                  className="input-field py-2.5 text-base font-mono font-bold text-white w-full"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Strategy:</span>
                  <span className="text-emerald-400 font-bold">+{selectedInvestor.roiPct}% APY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocol Copy Fee:</span>
                  <span className="text-slate-200 font-bold">0.0% (Zero-Fee Campaign)</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedInvestor(null)} className="btn-ghost flex-1 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 text-xs py-2.5 font-bold">
                  Confirm Copy Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
