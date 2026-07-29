import React, { useState } from 'react';
import { CheckCircle2, Loader2, ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';

export interface TxStep {
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface HumanTxFlowProps {
  currentStepIndex: number;
  txHash?: string;
  contractAddress?: string;
  blockNumber?: number;
  onComplete?: () => void;
}

const DEFAULT_HUMAN_STEPS = [
  'Creating your ownership certificate…',
  'Securing your investment…',
  'Recording ownership on the blockchain…',
  'Done.',
];

export function HumanTxFlow({
  currentStepIndex,
  txHash = '0x3f9e...82d1',
  contractAddress = '0x1111...1111',
  blockNumber = 14920812,
}: HumanTxFlowProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
      <div className="flex items-center gap-2 font-medium text-slate-200 border-b border-slate-800 pb-2">
        <FileText className="w-4 h-4 text-indigo-400" />
        <span>Investment Progress</span>
      </div>

      {/* Human Sequential Steps */}
      <div className="space-y-3">
        {DEFAULT_HUMAN_STEPS.map((stepLabel, idx) => {
          const isDone = idx < currentStepIndex || currentStepIndex === DEFAULT_HUMAN_STEPS.length - 1;
          const isCurrent = idx === currentStepIndex && currentStepIndex < DEFAULT_HUMAN_STEPS.length - 1;

          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800" />
                )}
              </div>
              <span
                className={`font-medium ${
                  isDone
                    ? 'text-emerald-300'
                    : isCurrent
                    ? 'text-indigo-300 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {stepLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Collapsed Technical Details */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Technical Details</span>
          {showTechnical ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTechnical && (
          <div className="mt-2 p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Transaction Hash:</span>
              <div className="flex items-center gap-1 text-indigo-300">
                <span>{txHash}</span>
                <button onClick={() => copyToClipboard(txHash)} className="hover:text-white">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Contract Address:</span>
              <span className="text-indigo-300">{contractAddress}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Polygon Amoy Block:</span>
              <span className="text-indigo-300">#{blockNumber}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
