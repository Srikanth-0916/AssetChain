import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';

export interface ConfidenceReason {
  text: string;
}

export interface ConfidenceCaveat {
  text: string;
}

interface ConfidenceMeterProps {
  confidencePct: number;
  reasons: string[];
  caveats: string[];
}

export function ConfidenceMeter({ confidencePct, reasons, caveats }: ConfidenceMeterProps) {
  return (
    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
      {/* Confidence Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">AI Decision Confidence Meter</h4>
            <p className="text-xs text-slate-400">Deterministic multi-dimensional evaluation</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-300">{confidencePct}% Confidence</span>
        </div>
      </div>

      {/* Positive Reasons (Because) */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Why recommended (Because)</span>
        <div className="space-y-1">
          {reasons.slice(0, 4).map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Caveats (Things to Consider) */}
      {caveats.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Things to Consider</span>
          <div className="space-y-1">
            {caveats.slice(0, 2).map((caveat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-amber-300/90">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{caveat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
