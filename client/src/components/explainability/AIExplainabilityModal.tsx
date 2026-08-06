import React from 'react';
import {
  Sparkles, Cpu, ShieldCheck, BarChart3, Info, CheckCircle2,
  AlertTriangle, Brain, ArrowRight, HelpCircle, Layers
} from 'lucide-react';

export interface MetricWeight {
  label: string;
  weightPercent: number;
  score: number; // 0 - 100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

export interface AIExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  modelName?: string;
  provider?: string;
  overallScore?: number;
  riskLevel?: 'Clean' | 'Low Risk' | 'Medium Risk' | 'High Risk';
  metrics?: MetricWeight[];
  summaryRationale?: string;
  inputParameters?: Record<string, any>;
}

export function AIExplainabilityModal({
  isOpen,
  onClose,
  title = "AI Copilot Risk & Valuation Model Explainability",
  modelName = "Gemini 2.0 Flash (Google DeepMind AI)",
  provider = "Google Generative AI / AssetChain RAG Engine",
  overallScore = 88,
  riskLevel = "Clean",
  metrics = [
    { label: "Rental Income Yield Stability", weightPercent: 25, score: 92, status: 'excellent', description: 'Long-term enterprise lease with 98% historical occupancy rate' },
    { label: "Market Price Volatility", weightPercent: 25, score: 85, status: 'good', description: 'Low historical variance in prime metropolitan commercial real estate' },
    { label: "Historical Asset Appreciation", weightPercent: 20, score: 88, status: 'excellent', description: '4.8% average annual appreciation over 5-year benchmark window' },
    { label: "AI Fraud & Title Deed Scan", weightPercent: 15, score: 100, status: 'excellent', description: 'OCR deed scan verified against municipal registry without encumbrance' },
    { label: "Ownership Verification Multi-Sig", weightPercent: 10, score: 95, status: 'excellent', description: 'Verified by 3 independent accredited legal and compliance officers' },
    { label: "Location & Infrastructure Rating", weightPercent: 5, score: 90, status: 'good', description: 'High connectivity index, proximity to commercial transport hubs' },
  ],
  summaryRationale = "This asset achieves an 88/100 Institutional Health Rating due to strong 98% occupancy, zero municipal title encumbrances, and 3/3 multi-sig verification approvals. Risk of capital loss is evaluated as Low.",
  inputParameters = {
    valuationUSD: 2500000,
    tokenSupply: 10000,
    tokenPriceUSD: 250,
    location: "Manhattan, NYC",
    kycRequirement: "ERC-3643 Whitelisted",
  },
}: AIExplainabilityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-card border border-purple-500/30 shadow-2xl rounded-2xl overflow-hidden p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Explainable AI (XAI) Architecture
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                Transparent Logic
              </span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-slate-400">Model: {modelName}</p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Close Explanation
          </button>
        </div>

        {/* Model Metadata Box */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Engine Model</span>
            <span className="font-semibold text-purple-300 flex items-center gap-1 mt-0.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" /> {modelName}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Provider / Vector Engine</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{provider}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Institutional Risk Rating</span>
            <span className="font-bold text-emerald-400 mt-0.5 block">{overallScore} / 100 ({riskLevel})</span>
          </div>
        </div>

        {/* Rationale Explanation Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-slate-950 border border-purple-500/30 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-purple-200 text-xs">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span>AI Reasoning & Recommendation Rationale</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {summaryRationale}
          </p>
        </div>

        {/* Transparent Metric Weight Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-400" /> Weighted Factor Breakdown
            </span>
            <span className="text-slate-400 text-[11px]">Sum of Weights: 100%</span>
          </div>

          <div className="space-y-2.5">
            {metrics.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                      {m.weightPercent}% Weight
                    </span>
                    <span className="font-semibold text-slate-200">{m.label}</span>
                  </div>
                  <span className={`font-mono font-bold text-xs ${m.score >= 85 ? 'text-emerald-400' : m.score >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                    {m.score}/100
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      m.score >= 85
                        ? 'bg-emerald-400'
                        : m.score >= 70
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Input Parameters Object */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
            Audited Model Inputs (No Secrets Exposed)
          </span>
          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-purple-300/90 overflow-x-auto">
            {JSON.stringify(inputParameters, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
}
