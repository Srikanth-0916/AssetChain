import React from 'react';
import { ShieldCheck, Sparkles, Cpu, Lock, CheckCircle2, Award } from 'lucide-react';

export function PlatformTrustBadges() {
  const BADGES = [
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-sky-400" />,
      label: 'AI-Verified Valuation',
      sub: 'Gemini 1.5 Flash Risk Model',
    },
    {
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'On-Chain Title Verification',
      sub: 'Polygon Amoy Ledger',
    },
    {
      icon: <Lock className="w-3.5 h-3.5 text-indigo-400" />,
      label: 'ERC-20 Smart Contract',
      sub: 'Non-Reentrant & Audited',
    },
    {
      icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
      label: 'IoT Oracle Valuation',
      sub: 'Chainlink Feed Simulation',
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />,
      label: 'Institutional SPV Legal Deed',
      sub: '30-Yr Search Guarantee',
    },
  ];

  return (
    <div className="w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Award className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Platform Security & Institutional Guarantees
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {BADGES.map((badge, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex flex-col gap-1 hover:border-indigo-500/30 transition-colors group"
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
              {badge.icon}
              <span className="truncate">{badge.label}</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">{badge.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
