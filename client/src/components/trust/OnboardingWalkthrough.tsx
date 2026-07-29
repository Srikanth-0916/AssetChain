import React, { useState, useEffect } from 'react';
import { Compass, X, ChevronRight, Check } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  targetHint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to TrustChain AI 👋',
    description: 'Fractional ownership of physical real-world assets powered by Polygon blockchain and Gemini AI.',
    targetHint: 'Overview',
  },
  {
    title: 'Marketplace',
    description: 'Browse verified real estate and renewable energy assets with 5-dimension AI ratings.',
    targetHint: 'Marketplace Tab',
  },
  {
    title: 'Portfolio & Sector Health',
    description: 'Track tokenized asset balances, dividend payouts, and real-time sector concentration warnings.',
    targetHint: 'Portfolio Tab',
  },
  {
    title: 'AI Financial Advisor',
    description: 'Get deterministic portfolio advice, fraud analysis, and market explainability insights.',
    targetHint: 'AI Copilot Tab',
  },
  {
    title: 'Trust Journey',
    description: 'Track your verification status, KYC level, and long-term investor milestones.',
    targetHint: 'Profile / Dashboard',
  },
];

export function OnboardingWalkthrough() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('trustchain_has_seen_onboarding');
    if (!hasSeen) {
      setActive(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('trustchain_has_seen_onboarding', 'true');
    setActive(false);
  };

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleDismiss();
    }
  };

  if (!active) return null;

  const current = TOUR_STEPS[stepIndex];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm p-4 bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold">
          <Compass className="w-4 h-4" />
          <span>Interactive Onboarding ({stepIndex + 1}/{TOUR_STEPS.length})</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white transition-colors"
          title="Dismiss tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white">{current.title}</h4>
        <p className="text-slate-300 leading-relaxed">{current.description}</p>
        <span className="inline-block pt-1 text-[10px] font-mono text-indigo-300">
          Target: {current.targetHint}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-200 text-xs font-medium"
        >
          Skip Tour
        </button>

        <button
          onClick={handleNext}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors shadow-md"
        >
          <span>{stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
          {stepIndex === TOUR_STEPS.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
