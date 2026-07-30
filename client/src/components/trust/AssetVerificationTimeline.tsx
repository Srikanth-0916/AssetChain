import React from 'react';
import {
  FileText, ShieldCheck, Vote, CheckCircle2, Coins, TrendingUp,
  Clock, ArrowRight, Check, Sparkles,
} from 'lucide-react';

export type VerificationStage =
  | 'submitted'
  | 'compliance'
  | 'verifier_vote'
  | 'blockchain_approval'
  | 'token_minted'
  | 'investment_open';

export interface AssetVerificationTimelineProps {
  currentStage?: VerificationStage;
  assetTitle?: string;
  txHash?: string;
  contractAddress?: string;
  verifierVotesCount?: number;
  requiredVotesCount?: number;
  compact?: boolean;
}

const STAGES: {
  id: VerificationStage;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'submitted',
    label: 'Submitted',
    description: 'Asset documentation & SPV details uploaded',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'ERC-3643 legal & regulatory identity check',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: 'verifier_vote',
    label: 'Verifier Vote',
    description: '2-of-3 multi-sig verifier consensus voting',
    icon: <Vote className="w-4 h-4" />,
  },
  {
    id: 'blockchain_approval',
    label: 'Blockchain Approval',
    description: 'On-chain approval event recorded on Polygon Amoy',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    id: 'token_minted',
    label: 'Token Minted',
    description: 'Asset token smart contract deployed & minted',
    icon: <Coins className="w-4 h-4" />,
  },
  {
    id: 'investment_open',
    label: 'Investment Open',
    description: 'Asset open for primary fractional investment',
    icon: <TrendingUp className="w-4 h-4" />,
  },
];

export function AssetVerificationTimeline({
  currentStage = 'investment_open',
  assetTitle = 'Tokenized Real-World Asset',
  txHash,
  contractAddress,
  verifierVotesCount = 2,
  requiredVotesCount = 2,
  compact = false,
}: AssetVerificationTimelineProps) {
  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const activeIndex = currentStageIndex === -1 ? STAGES.length - 1 : currentStageIndex;

  if (compact) {
    return (
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-white">Verification Status</span>
          <span className="text-emerald-400 font-mono text-[11px] font-bold uppercase">
            {STAGES[activeIndex].label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STAGES.map((s, idx) => {
            const isPassed = idx <= activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                    isPassed
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                  title={`${s.label}: ${s.description}`}
                >
                  {isPassed ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`w-3 h-0.5 ${idx < activeIndex ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Asset Verification Timeline</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              On-Chain Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {assetTitle} · End-to-end verification pipeline
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Multi-Sig Vote:</span>
          <span className="text-emerald-400 font-bold">{verifierVotesCount}/{requiredVotesCount} Approved</span>
        </div>
      </div>

      {/* 6-Stage Timeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative">
        {STAGES.map((stage, idx) => {
          const isPassed = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 relative transition-all ${
                isCurrent
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : isPassed
                  ? 'bg-slate-900/80 border-emerald-500/30'
                  : 'bg-slate-950/40 border-white/[0.04] opacity-50'
              }`}
            >
              {/* Stage header badge */}
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${
                  isPassed
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : isCurrent
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  {stage.icon}
                </div>
                <span className="text-[10px] font-mono text-slate-500">Step {idx + 1}</span>
              </div>

              {/* Title & description */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <h4 className={`text-xs font-bold leading-tight ${isPassed ? 'text-white' : 'text-slate-400'}`}>
                    {stage.label}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">{stage.description}</p>
              </div>

              {/* Status pill */}
              <div className={`mt-auto text-[10px] font-semibold px-2 py-0.5 rounded-md border w-fit ${
                isPassed
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
              }`}>
                {isPassed ? (isCurrent ? 'Active Stage' : 'Complete') : 'Upcoming'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contract & TX details */}
      {(txHash || contractAddress) && (
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          {contractAddress && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Contract:</span>
              <span className="text-indigo-300">{contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}</span>
            </div>
          )}
          {txHash && (
            <a
              href={`https://amoy.polygonscan.com/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Tx: {txHash.slice(0, 10)}...</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
