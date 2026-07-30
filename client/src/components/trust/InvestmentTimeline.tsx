import React from 'react';
import {
  FileText, Key, Radio, CheckCircle2, Coins, PieChart,
  Loader2, Check, Clock, ExternalLink, Hash,
} from 'lucide-react';

export type InvestmentStage =
  | 'submitted'
  | 'wallet_signed'
  | 'broadcast'
  | 'confirmed'
  | 'minted'
  | 'portfolio_updated';

export interface InvestmentTimelineProps {
  currentStage?: InvestmentStage;
  stageIndex?: number; // 0 to 5
  txHash?: string;
  contractAddress?: string;
  blockNumber?: number;
  tokensPurchased?: number;
  assetTitle?: string;
  compact?: boolean;
}

const INVESTMENT_STAGES: {
  id: InvestmentStage;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'submitted',
    label: 'Submitted',
    description: 'Investment order created and initialized',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'wallet_signed',
    label: 'Wallet Signed',
    description: 'Off-chain message or Web3 transaction signed by user wallet',
    icon: <Key className="w-4 h-4" />,
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    description: 'Transaction broadcast to Polygon Amoy RPC node',
    icon: <Radio className="w-4 h-4" />,
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    description: 'Block confirmations received on Polygon Amoy',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    id: 'minted',
    label: 'Minted',
    description: 'Fractional asset tokens minted/transferred on-chain',
    icon: <Coins className="w-4 h-4" />,
  },
  {
    id: 'portfolio_updated',
    label: 'Portfolio Updated',
    description: 'Token holdings & dividend rights attached to user portfolio',
    icon: <PieChart className="w-4 h-4" />,
  },
];

export function InvestmentTimeline({
  currentStage = 'portfolio_updated',
  stageIndex,
  txHash = '0x3f9e...82d1',
  contractAddress = '0xTreasuryContract',
  blockNumber = 14920812,
  tokensPurchased = 40,
  assetTitle = 'Tokenized Real-World Asset',
  compact = false,
}: InvestmentTimelineProps) {
  const calculatedIndex = stageIndex !== undefined
    ? stageIndex
    : INVESTMENT_STAGES.findIndex((s) => s.id === currentStage);
  
  const activeIndex = calculatedIndex === -1 ? INVESTMENT_STAGES.length - 1 : calculatedIndex;

  if (compact) {
    return (
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-white">Investment Progress</span>
          <span className="text-emerald-400 font-mono text-[11px] font-bold uppercase">
            {INVESTMENT_STAGES[activeIndex].label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {INVESTMENT_STAGES.map((s, idx) => {
            const isDone = idx <= activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                  title={`${s.label}: ${s.description}`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                {idx < INVESTMENT_STAGES.length - 1 && (
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
            <h3 className="text-base font-bold text-white">Investment Lifecycle Timeline</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
              Blockchain Transaction
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {assetTitle} · {tokensPurchased} ACT Tokens
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Status:</span>
          <span className="text-emerald-400 font-bold uppercase">{INVESTMENT_STAGES[activeIndex].label}</span>
        </div>
      </div>

      {/* 6-Stage Horizontal Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative">
        {INVESTMENT_STAGES.map((stage, idx) => {
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex && activeIndex < INVESTMENT_STAGES.length - 1;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 relative transition-all ${
                isCurrent
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : isDone
                  ? 'bg-slate-900/80 border-emerald-500/30'
                  : 'bg-slate-950/40 border-white/[0.04] opacity-50'
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${
                  isDone
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
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <h4 className={`text-xs font-bold leading-tight ${isDone ? 'text-white' : 'text-slate-400'}`}>
                    {stage.label}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">{stage.description}</p>
              </div>

              {/* Status pill */}
              <div className={`mt-auto text-[10px] font-semibold px-2 py-0.5 rounded-md border w-fit ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
              }`}>
                {isDone ? (isCurrent ? 'Processing' : 'Confirmed') : 'Pending'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical proofs */}
      <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-500">Tx Hash:</span>
          <span className="text-indigo-300">{txHash}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Block: <strong className="text-white">#{blockNumber}</strong></span>
          {txHash && !txHash.includes('Processing') && (
            <a
              href={`https://amoy.polygonscan.com/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>PolygonScan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
