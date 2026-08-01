import React, { useState } from 'react';
import { X, FileText, Download, ShieldCheck, CheckCircle2, Sparkles, AlertCircle, Building2 } from 'lucide-react';

interface DueDiligenceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetTitle?: string;
}

export function DueDiligenceReportModal({ isOpen, onClose, assetTitle = 'Manhattan Commercial Plaza' }: DueDiligenceReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsDone(true);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-6 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">AI Institutional Due Diligence Report</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white">✕</button>
        </div>

        {/* Report Overview */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="pill-badge pill-success text-[10px]">Institutional Assessment</span>
              <h3 className="text-lg font-bold text-white mt-1">{assetTitle}</h3>
              <p className="text-xs text-slate-400">Comprehensive 40-Page Institutional Risk & Legal Audit Report</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <div className="text-xl font-bold text-indigo-300">94 / 100</div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Trust Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs pt-2">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-500 text-[10px]">Title Deed Status</div>
              <div className="font-bold text-emerald-400">100% Encumbrance Cleared</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-500 text-[10px]">Occupancy Rate</div>
              <div className="font-bold text-white">98.5% Occupied</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-500 text-[10px]">AI Risk Rating</div>
              <div className="font-bold text-indigo-300">Low Volatility</div>
            </div>
          </div>
        </div>

        {/* Report Action */}
        {isDone ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Due Diligence Report PDF Ready for Export
            </div>
            <button
              onClick={() => { alert('Downloading Institutional Due Diligence Report PDF...'); onClose(); }}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full btn-primary text-xs py-3 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>Generating Institutional PDF Assessment...</>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate AI Due Diligence Report (PDF)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
