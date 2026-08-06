import React, { useState } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Sparkles,
  Compass, Target, Info, CheckCircle2, ArrowRight, Zap, Code2
} from 'lucide-react';

export interface PageHeaderExplainerProps {
  title: string;
  subtitle: string;
  category?: string;
  whereAmI?: string;
  whatIsThis: string;
  whyImportant?: string;
  whatCanIDo?: string;
  whatNext?: string;
  whatHappensNext?: string;
  whyBlockchain?: string;
  whyAI?: string;
  technicalDetails?: string;
  defaultExpanded?: boolean;
}

export function PageHeaderExplainer({
  title,
  subtitle,
  category = 'Institutional Asset Portal',
  whereAmI = 'AssetChain Commercial Platform',
  whatIsThis,
  whyImportant = 'Enforces security, transparency, and legal ownership for all users.',
  whatCanIDo = 'Explore verified properties, manage investments, and track returns.',
  whatNext = 'Click any action button to initiate secure automated operations.',
  whatHappensNext = 'Smart contracts automatically process your request and record cryptographic verification.',
  whyBlockchain = 'Provides immutable ownership verification and automated profit payouts without intermediaries.',
  whyAI = 'Analyzes market stability, due diligence records, and fraud risk scores in real-time.',
  technicalDetails,
  defaultExpanded = true,
}: PageHeaderExplainerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showTechDetails, setShowTechDetails] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl mb-6">
      {/* Background Accent Lines */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="p-5 md:p-6 space-y-4">
        {/* Top Header Line */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                {category}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Investment Compliance Verified
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-semibold shrink-0 transition-all shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">{isExpanded ? 'Hide Guide' : 'How This Works'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 5-Question User Guidance Panel */}
        {isExpanded && (
          <div className="pt-4 border-t border-slate-800/80 space-y-4 animate-fade-in text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Question 1: Where am I? */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>1. Where am I?</span>
                </div>
                <p className="text-slate-300 leading-normal text-[11px]">{whereAmI}</p>
              </div>

              {/* Question 2: What is this page? */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>2. What is this page?</span>
                </div>
                <p className="text-slate-300 leading-normal text-[11px]">{whatIsThis}</p>
              </div>

              {/* Question 3: Why is this important? */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>3. Why is it important?</span>
                </div>
                <p className="text-slate-300 leading-normal text-[11px]">{whyImportant}</p>
              </div>

              {/* Question 4: What can I do here? */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>4. What can I do here?</span>
                </div>
                <p className="text-slate-300 leading-normal text-[11px]">{whatCanIDo}</p>
              </div>

              {/* Question 5: What happens after I click a button? */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>5. What happens next?</span>
                </div>
                <p className="text-slate-300 leading-normal text-[11px]">{whatNext || whatHappensNext}</p>
              </div>
            </div>

            {/* Tech Details Expandable Drawer */}
            <div className="pt-2">
              <button
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 font-semibold"
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                {showTechDetails ? 'Hide Advanced Technical Details' : 'View Advanced Technical Details (Blockchain & AI Architecture)'}
                {showTechDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showTechDetails && (
                <div className="mt-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-2 text-slate-300 font-mono">
                  <div className="text-indigo-400 font-bold font-sans">⚡ Blockchain & Smart Contract Architecture</div>
                  <p className="text-slate-400 font-sans leading-relaxed">{whyBlockchain}</p>

                  <div className="text-purple-400 font-bold font-sans pt-1">🧠 Artificial Intelligence & Verification Engine</div>
                  <p className="text-slate-400 font-sans leading-relaxed">{whyAI}</p>

                  {technicalDetails && (
                    <div className="pt-2 border-t border-slate-800 text-slate-400 text-[10px]">
                      {technicalDetails}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
