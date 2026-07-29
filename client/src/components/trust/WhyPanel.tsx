import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ExplainabilityFactor {
  label: string;
  value: string | number;
  status?: 'positive' | 'warning' | 'neutral';
  explanation: string;
}

interface WhyPanelProps {
  title?: string;
  factors: ExplainabilityFactor[];
  compact?: boolean;
}

export function WhyPanel({ title = 'Why this score?', factors, compact = false }: WhyPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="inline-block text-left my-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md transition-colors"
        title="View explainability breakdown"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Why?</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-slate-900/90 border border-indigo-500/30 rounded-lg shadow-xl text-xs space-y-2 max-w-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="font-semibold text-indigo-300 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{title}</span>
            <span className="text-[10px] text-slate-400 font-normal">Deterministic AI Breakdown</span>
          </div>

          <div className="space-y-2 pt-1">
            {factors.map((factor, idx) => (
              <div key={idx} className="flex flex-col space-y-0.5">
                <div className="flex items-center justify-between text-slate-200 font-medium">
                  <div className="flex items-center gap-1.5">
                    {factor.status === 'positive' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {factor.status === 'warning' && <AlertCircle className="w-3 h-3 text-amber-400" />}
                    <span>{factor.label}</span>
                  </div>
                  <span className="font-mono text-indigo-300">{factor.value}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug pl-4">{factor.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
