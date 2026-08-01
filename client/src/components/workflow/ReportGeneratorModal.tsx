import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle2, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportGeneratorModal({ isOpen, onClose }: ReportGeneratorModalProps) {
  const [selectedType, setSelectedType] = useState<string>('investment');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<string | null>(null);

  if (!isOpen) return null;

  const reportTypes = [
    { id: 'investment', title: 'Institutional Investment Summary', desc: 'Complete breakdown of holdings, purchase prices, valuations, and current ROI.' },
    { id: 'tax', title: 'Q2 Tax & Encumbrance Statement', desc: 'Calculated capital gains, rental income withholding tax, and tax liabilities.' },
    { id: 'dividend', title: 'On-Chain Dividend Payout Schedule', desc: 'Historical dividend disbursements, yield trends, and bank transfer receipts.' },
    { id: 'compliance', title: 'ERC-3643 Regulatory Compliance Audit', desc: 'SEBI/RBI regulatory compliance proof, KYC/AML audit log, and identity verification.' },
    { id: 'performance', title: 'Portfolio Performance & Benchmark Report', desc: 'IRR calculations, net profit trends, and S&P 500 asset benchmark comparison.' },
    { id: 'transaction', title: 'Polygon Amoy Transaction History', desc: 'Raw on-chain transaction hashes, block numbers, gas fees, and smart contract logs.' },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const selected = reportTypes.find(r => r.id === selectedType);
      setGeneratedPdf(`${selected?.title || 'Report'}_2026_Q2.pdf`);
    }, 1000);
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
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Institutional Report Generator</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white">✕</button>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-slate-400">Select Report Type to Export:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map((rt) => (
              <div
                key={rt.id}
                onClick={() => { setSelectedType(rt.id); setGeneratedPdf(null); }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-xs space-y-1
                  ${selectedType === rt.id ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-500/20'}`}
              >
                <div className="font-bold text-white flex items-center justify-between">
                  {rt.title}
                  {selectedType === rt.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-slate-400">{rt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {generatedPdf ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {generatedPdf} Ready for Download
            </div>
            <button
              onClick={() => { alert(`Downloading ${generatedPdf}...`); onClose(); }}
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
            {isGenerating ? <>Generating Report PDF...</> : <><Sparkles className="w-4 h-4" /> Generate Selected PDF Report</>}
          </button>
        )}
      </div>
    </div>
  );
}
