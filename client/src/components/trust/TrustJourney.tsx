import React from 'react';
import { CheckCircle2, Circle, Trophy, Shield, ArrowRight } from 'lucide-react';

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface TrustJourneyProps {
  completedSteps?: string[];
}

const DEFAULT_JOURNEY_STEPS: JourneyStep[] = [
  { id: 'account', title: 'Account Created', description: 'Linked identity & security credentials', completed: true },
  { id: 'kyc', title: 'KYC Completed', description: 'ERC-3643 identity verification', completed: true },
  { id: 'first_inv', title: 'First Investment', description: 'Acquired initial asset tokens', completed: true },
  { id: 'diversified', title: 'Portfolio Diversified', description: 'Invested across 2+ distinct sectors', completed: true },
  { id: 'rental', title: 'First Rental Payout', description: 'Claimed dividend distribution from Treasury', completed: true },
  { id: 'dao_vote', title: 'DAO Vote Cast', description: 'Participated in governance proposal vote', completed: false },
  { id: 'long_term', title: 'Long-Term Investor', description: 'Held asset position for >= 6 months', completed: false },
];

export function TrustJourney({ completedSteps = ['account', 'kyc', 'first_inv', 'diversified', 'rental'] }: TrustJourneyProps) {
  const steps = DEFAULT_JOURNEY_STEPS.map((s) => ({
    ...s,
    completed: completedSteps.includes(s.id),
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-lg text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Trust Journey</h3>
            <p className="text-slate-400">Investor progression & verification milestones</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full font-bold text-amber-300">
          <span>{completedCount} / {steps.length} Completed ({progressPct}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-400 h-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Milestone Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
              step.completed
                ? 'bg-slate-950/60 border-emerald-500/30 text-slate-200'
                : 'bg-slate-950/30 border-slate-800 text-slate-500'
            }`}
          >
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className={`font-semibold ${step.completed ? 'text-white' : 'text-slate-400'}`}>
                {step.title}
              </span>
              <p className="text-[11px] text-slate-400 leading-tight">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
