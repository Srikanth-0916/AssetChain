/**
 * ExplainPanel — Universal "Why?" explainability panel.
 *
 * A premium, collapsible panel that shows scored factors with
 * progress bars, icons, and explanations. Used by:
 *   - TrustScorePanel   (Trust Score Breakdown)
 *   - ROIBreakdownPanel (ROI Breakdown)
 *   - RiskBreakdownPanel (Risk Breakdown)
 *   - RecommendationPanel (Recommendation Breakdown)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle, ChevronDown, CheckCircle2, AlertTriangle,
  XCircle, Info, Minus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FactorStatus = 'positive' | 'warning' | 'negative' | 'neutral' | 'info';

export interface ExplainFactor {
  icon?: React.ReactNode;
  label: string;
  /** Short value shown on the right (e.g. "20/20" or "85%" or "High") */
  value: string | number;
  status: FactorStatus;
  explanation: string;
  /** 0-100 fill for the mini progress bar. Omit to hide the bar. */
  progress?: number;
  /** Dim sub-label under the main label */
  sub?: string;
}

export interface ExplainPanelProps {
  /** Trigger button label shown inline */
  triggerLabel?: string;
  /** Panel heading */
  title: string;
  /** Optional subtitle shown in the panel header */
  subtitle?: string;
  factors: ExplainFactor[];
  /** Optional disclaimer shown at the bottom */
  disclaimer?: string;
  /** Overall score chip shown in panel header (e.g. "88/100") */
  score?: string;
  /** Color class for the score chip (defaults to indigo) */
  scoreColor?: string;
  /** If true, opens inline below; otherwise opens as a floating popover */
  inline?: boolean;
  /** Extra CSS class on the trigger button */
  triggerClassName?: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FactorStatus, {
  icon: React.ReactNode;
  textColor: string;
  barColor: string;
  chipBg: string;
  chipText: string;
}> = {
  positive: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    textColor: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    chipBg: 'bg-emerald-500/10',
    chipText: 'text-emerald-400',
  },
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    textColor: 'text-amber-400',
    barColor: 'bg-amber-500',
    chipBg: 'bg-amber-500/10',
    chipText: 'text-amber-400',
  },
  negative: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    textColor: 'text-red-400',
    barColor: 'bg-red-500',
    chipBg: 'bg-red-500/10',
    chipText: 'text-red-400',
  },
  neutral: {
    icon: <Minus className="w-3.5 h-3.5" />,
    textColor: 'text-slate-400',
    barColor: 'bg-slate-600',
    chipBg: 'bg-slate-700/50',
    chipText: 'text-slate-400',
  },
  info: {
    icon: <Info className="w-3.5 h-3.5" />,
    textColor: 'text-indigo-400',
    barColor: 'bg-indigo-500',
    chipBg: 'bg-indigo-500/10',
    chipText: 'text-indigo-400',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExplainPanel({
  triggerLabel = 'Why?',
  title,
  subtitle,
  factors,
  disclaimer,
  score,
  scoreColor = 'text-indigo-300',
  inline = false,
  triggerClassName = '',
}: ExplainPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click (popover mode only)
  useEffect(() => {
    if (inline || !open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, inline]);

  const positiveCount = factors.filter(f => f.status === 'positive').length;
  const warningCount  = factors.filter(f => f.status === 'warning' || f.status === 'negative').length;

  return (
    <div ref={panelRef} className={`relative ${inline ? 'w-full' : 'inline-block'}`}>
      {/* ── Trigger Button ── */}
      <button
        id={`explain-btn-${title.replace(/\s+/g, '-').toLowerCase()}`}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold
          transition-all duration-200 cursor-pointer select-none
          ${open
            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
            : 'bg-indigo-500/8 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15 hover:border-indigo-500/35'
          }
          ${triggerClassName}
        `}
      >
        <HelpCircle className="w-3 h-3" />
        {triggerLabel}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          className={`
            explain-panel animate-fade-in
            ${inline
              ? 'mt-3 w-full'
              : 'absolute z-50 top-full mt-2 right-0 w-[360px]'
            }
          `}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="explain-panel-header">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{title}</span>
                {score && (
                  <span className={`text-xs font-bold font-mono ${scoreColor} bg-white/5 px-1.5 py-0.5 rounded`}>
                    {score}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {/* Summary chips */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {positiveCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  {positiveCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  {warningCount}
                </span>
              )}
            </div>
          </div>

          {/* Factor rows */}
          <div className="p-4 space-y-4">
            {factors.map((factor, idx) => {
              const cfg = STATUS_CONFIG[factor.status];
              return (
                <div key={idx} className="explain-row">
                  {/* Left: status icon */}
                  <div className={`mt-0.5 flex-shrink-0 ${cfg.textColor}`}>
                    {factor.icon ?? cfg.icon}
                  </div>

                  {/* Right: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 leading-none">
                          {factor.label}
                        </span>
                        {factor.sub && (
                          <span className="ml-1.5 text-[10px] text-slate-500">{factor.sub}</span>
                        )}
                      </div>
                      <span className={`text-xs font-bold font-mono flex-shrink-0 ${cfg.textColor}`}>
                        {factor.value}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {factor.progress !== undefined && (
                      <div className="progress-bar-track mb-1.5">
                        <div
                          className={`progress-bar-fill ${cfg.barColor}`}
                          style={{ width: `${Math.min(100, Math.max(0, factor.progress))}%` }}
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {factor.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          {disclaimer && (
            <div className="px-4 pb-4 text-[10px] text-slate-600 border-t border-white/[0.04] pt-3 leading-snug">
              {disclaimer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
