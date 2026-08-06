import React from 'react';
import {
  CheckCircle2, Loader2, Clock, AlertTriangle, Cpu, ShieldCheck,
  FileCheck2, Database, Coins, Layers, ArrowRight, X
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  title: string;
  subtitle: string;
  status: 'done' | 'in_progress' | 'pending' | 'error';
  techDetails?: string;
}

export interface WhatsHappeningNowPanelProps {
  title?: string;
  subtitle?: string;
  steps: WorkflowStep[];
  isOpen: boolean;
  onClose?: () => void;
  isComplete?: boolean;
  error?: string | null;
  currentStepIndex?: number;
}

export function WhatsHappeningNowPanel({
  title = "What's Happening Now?",
  subtitle = "Live technical execution of Web3, AI, and database pipelines",
  steps,
  isOpen,
  onClose,
  isComplete = false,
  error = null,
}: WhatsHappeningNowPanelProps) {
  if (!isOpen) return null;

  const completedCount = steps.filter((s) => s.status === 'done').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-card border border-indigo-500/30 shadow-2xl rounded-2xl overflow-hidden p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" /> Pipeline Execution
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                {progressPercent}% Completed
              </span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>

          {onClose && isComplete && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Workflow Progress</span>
            <span>{completedCount} of {steps.length} steps</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Execution Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Step-by-Step Progress List */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          {steps.map((step, idx) => {
            const isDone = step.status === 'done';
            const isInProgress = step.status === 'in_progress';
            const isError = step.status === 'error';

            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isDone
                    ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                    : isInProgress
                    ? 'bg-indigo-500/[0.08] border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : isError
                    ? 'bg-red-500/[0.05] border-red-500/30'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                {/* Step Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isInProgress ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : isError ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isDone ? 'text-white' : isInProgress ? 'text-indigo-200 font-bold' : 'text-slate-400'}`}>
                      {idx + 1}. {step.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-mono">
                      {isDone ? (
                        <span className="text-emerald-400 font-bold">Passed</span>
                      ) : isInProgress ? (
                        <span className="text-indigo-400 font-bold animate-pulse">Running…</span>
                      ) : isError ? (
                        <span className="text-red-400 font-bold">Failed</span>
                      ) : (
                        <span className="text-slate-500">Queued</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{step.subtitle}</p>

                  {step.techDetails && (
                    <div className="mt-1 text-[10px] font-mono text-indigo-300/80 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/10">
                      {step.techDetails}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer / Controls */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Polygon Amoy Testnet · Supabase DB Sync</span>
          </div>

          {onClose && isComplete && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
