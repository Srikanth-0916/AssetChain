import React from 'react';
import { DollarSign, Wallet, ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export interface InvestmentWorkflowStepperProps {
  currentStep?: number;
}

export function InvestmentWorkflowStepper({ currentStep = 1 }: InvestmentWorkflowStepperProps) {
  const STEPS = [
    { step: 1, title: '1. Choose Amount', desc: 'Select investment size & fractional shares', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { step: 2, title: '2. Connect Wallet', desc: 'Link your Web3 wallet or email wallet', icon: <Wallet className="w-3.5 h-3.5" /> },
    { step: 3, title: '3. Sign Ownership', desc: 'Verify identity & ownership signature', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { step: 4, title: '4. Approve Transaction', desc: 'Confirm payment via UPI, Card, or USDC', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { step: 5, title: '5. Tokens Transferred', desc: 'Property shares appear in your portfolio', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Fractional Property Purchase Workflow
        </h4>
        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          Step {currentStep} of 5
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {STEPS.map((s) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <div
              key={s.step}
              className={`p-2.5 rounded-xl border transition-all space-y-1 ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/40 text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>{s.title}</span>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="shrink-0">{s.icon}</div>}
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
