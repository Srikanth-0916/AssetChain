import React from 'react';
import {
  PlusCircle, Sparkles, ShieldCheck, Users, Coins, Store,
  DollarSign, Vote, CheckCircle2, Clock, Layers
} from 'lucide-react';

export interface LifecycleStage {
  id: string;
  number: number;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  icon: React.ReactNode;
}

export interface AssetLifecycleTimelineProps {
  currentStageNumber?: number; // 1 to 9
  compact?: boolean;
}

export function AssetLifecycleTimeline({
  currentStageNumber = 6,
  compact = false,
}: AssetLifecycleTimelineProps) {
  const STAGES: LifecycleStage[] = [
    { id: '1', number: 1, label: 'Asset Created', description: 'Originator submits property specs & SPV data', status: currentStageNumber > 1 ? 'completed' : currentStageNumber === 1 ? 'current' : 'upcoming', icon: <PlusCircle className="w-3.5 h-3.5" /> },
    { id: '2', number: 2, label: 'AI OCR Scan', description: 'Gemini AI scans deed & detects fraud risks', status: currentStageNumber > 2 ? 'completed' : currentStageNumber === 2 ? 'current' : 'upcoming', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: '3', number: 3, label: 'Legal Review', description: 'Accredited legal team validates title encumbrances', status: currentStageNumber > 3 ? 'completed' : currentStageNumber === 3 ? 'current' : 'upcoming', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: '4', number: 4, label: 'Compliance KYC', description: 'Compliance officer checks AML & ERC-3643 whitelist', status: currentStageNumber > 4 ? 'completed' : currentStageNumber === 4 ? 'current' : 'upcoming', icon: <Users className="w-3.5 h-3.5" /> },
    { id: '5', number: 5, label: 'On-Chain Mint', description: 'Smart contract mints fractional ERC-20 tokens', status: currentStageNumber > 5 ? 'completed' : currentStageNumber === 5 ? 'current' : 'upcoming', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: '6', number: 6, label: 'Marketplace', description: 'Asset listed for fractional investor purchasing', status: currentStageNumber > 6 ? 'completed' : currentStageNumber === 6 ? 'current' : 'upcoming', icon: <Store className="w-3.5 h-3.5" /> },
    { id: '7', number: 7, label: 'Investor Buy', description: 'Web3 investors purchase fractional tokens', status: currentStageNumber > 7 ? 'completed' : currentStageNumber === 7 ? 'current' : 'upcoming', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: '8', number: 8, label: 'Yield Payouts', description: 'Automated rental yields paid to token holders', status: currentStageNumber > 8 ? 'completed' : currentStageNumber === 8 ? 'current' : 'upcoming', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: '9', number: 9, label: 'DAO Governance', description: 'Token holders vote on asset management proposals', status: currentStageNumber >= 9 ? 'completed' : currentStageNumber === 9 ? 'current' : 'upcoming', icon: <Vote className="w-3.5 h-3.5" /> },
  ];

  if (compact) {
    return (
      <div className="p-3 rounded-xl bg-slate-950/70 border border-indigo-500/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> RWA Lifecycle Status
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
            Stage {currentStageNumber} / 9
          </span>
        </div>

        <div className="grid grid-cols-9 gap-1">
          {STAGES.map((s) => (
            <div
              key={s.id}
              title={`${s.number}. ${s.label} — ${s.description}`}
              className={`h-2 rounded-full transition-all ${
                s.status === 'completed'
                  ? 'bg-emerald-400'
                  : s.status === 'current'
                  ? 'bg-indigo-500 animate-pulse shadow-md shadow-indigo-500/50'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Complete RWA Token Lifecycle Timeline
          </h4>
          <p className="text-xs text-slate-400">9-Stage Institutional Verification & Governance Progression</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
          Current Stage: {STAGES.find((s) => s.status === 'current')?.label || 'Marketplace'}
        </span>
      </div>

      {/* Timeline Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2">
        {STAGES.map((s) => {
          const isCompleted = s.status === 'completed';
          const isCurrent = s.status === 'current';

          return (
            <div
              key={s.id}
              className={`p-2.5 rounded-xl border transition-all space-y-1.5 flex flex-col justify-between ${
                isCompleted
                  ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                  : isCurrent
                  ? 'bg-indigo-500/15 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                  isCompleted
                    ? 'bg-emerald-500 text-slate-950'
                    : isCurrent
                    ? 'bg-indigo-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {s.number}
                </span>
                <span className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="text-indigo-400">{s.icon}</div>
                  )}
                </span>
              </div>

              <div>
                <div className={`text-[11px] font-bold leading-tight ${isCompleted ? 'text-white' : isCurrent ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {s.label}
                </div>
                <p className="text-[9px] text-slate-400 leading-snug mt-0.5 line-clamp-2">{s.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
