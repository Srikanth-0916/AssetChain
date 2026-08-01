import React from 'react';
import {
  CheckCircle2, Clock, ShieldCheck, FileCheck, Coins,
  TrendingUp, Layers, Check, ArrowRight
} from 'lucide-react';

export interface TimelineStage {
  id: string;
  stageName: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
  txHash?: string;
}

const STAGES: TimelineStage[] = [
  { id: 's1', stageName: 'Asset Uploaded', date: 'Jan 10, 2026', status: 'completed', description: 'Deeds & property survey submitted by owner' },
  { id: 's2', stageName: 'OCR Document Verification', date: 'Jan 12, 2026', status: 'completed', description: '98.4% confidence extraction from Sub-Registrar deed' },
  { id: 's3', stageName: 'Legal Review Cleared', date: 'Jan 15, 2026', status: 'completed', description: '30-year Nil-Encumbrance certified by Advocate' },
  { id: 's4', stageName: 'Compliance Review (ERC-3643)', date: 'Jan 18, 2026', status: 'completed', description: 'Sanctions & liveness identity screening' },
  { id: 's5', stageName: '2-of-3 Multi-Sig Approved', date: 'Jan 20, 2026', status: 'completed', description: 'Signed on-chain by Trustee, Auditor, Admin', txHash: '0x8f9d...1f90' },
  { id: 's6', stageName: 'Tokenized on Polygon', date: 'Jan 22, 2026', status: 'completed', description: '10,000 ERC-3643 tokens minted', txHash: '0x489d...fb10' },
  { id: 's7', stageName: 'Primary Funding Started', date: 'Jan 25, 2026', status: 'completed', description: 'Token sale opened to whitelisted investors' },
  { id: 's8', stageName: 'Funding Goal Completed', date: 'Feb 14, 2026', status: 'completed', description: '$2,500,000 capital raised (100% sold)' },
  { id: 's9', stageName: 'Q1 Dividend Disbursed', date: 'Mar 31, 2026', status: 'completed', description: '$48,250 rental income deposited to tokenholders' },
  { id: 's10', stageName: 'Secondary Market Live', date: 'Active Now', status: 'current', description: 'Peer-to-peer liquidity orders active on escrow' },
];

export function AssetTimelineComponent() {
  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <span className="pill-badge pill-success text-[10px]">Lifecycle Progress</span>
          <h3 className="text-xl font-bold text-white mt-1">Asset Lifecycle & On-Chain Audit Timeline</h3>
          <p className="text-xs text-slate-400">Sequential verification stages from initial deed upload to secondary market liquidity.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-emerald-400">100% Verified</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold">10 / 10 Stages Complete</div>
        </div>
      </div>

      {/* Horizontal / Vertical Stepper */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-500/30">
        {STAGES.map((stage, idx) => (
          <div key={stage.id} className="relative flex items-start justify-between gap-4 group">
            {/* Step Icon */}
            <div className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${stage.status === 'completed' ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20' :
                stage.status === 'current' ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30 animate-pulse' :
                'bg-slate-800 text-slate-500 border border-slate-700'}`}
            >
              {stage.status === 'completed' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
            </div>

            {/* Stage Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {stage.stageName}
                </h4>
                {stage.status === 'current' && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold animate-pulse">
                    LIVE NOW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{stage.description}</p>
              {stage.txHash && (
                <div className="text-[10px] font-mono text-purple-400 mt-1">On-Chain Tx: {stage.txHash}</div>
              )}
            </div>

            <div className="text-xs font-mono text-slate-500 shrink-0">{stage.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
