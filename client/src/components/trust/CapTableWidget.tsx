import React from 'react';
import { PieChart, ShieldCheck, Users, Building2, Lock, Coins } from 'lucide-react';

export interface CapTableEntry {
  holderGroup: string;
  percentage: number;
  tokens: number;
  value: string;
  color: string;
  category: string;
}

const CAP_TABLE_DATA: CapTableEntry[] = [
  { holderGroup: 'Public Retail & Institutional Investors', percentage: 45, tokens: 4500, value: '$1,125,000', color: '#10b981', category: 'Tokenized Investors' },
  { holderGroup: 'Asset Owner (TrustChain Creator SPV)', percentage: 40, tokens: 4000, value: '$1,000,000', color: '#6366f1', category: 'Sponsor Equity' },
  { holderGroup: 'TrustChain Asset Treasury Vault', percentage: 10, tokens: 1000, value: '$250,000', color: '#f59e0b', category: 'Liquidity Reserve' },
  { holderGroup: 'Emergency & Legal Dispute Reserved', percentage: 5, tokens: 500, value: '$125,000', color: '#ec4899', category: 'Escrow Reserve' },
];

export function CapTableWidget() {
  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <span className="pill-badge pill-success text-[10px]">Equity & Token Cap Table</span>
          <h3 className="text-xl font-bold text-white mt-1">Ownership Distribution Cap Table</h3>
          <p className="text-xs text-slate-400">Institutional breakdown of token supply & equity allocation in SPV.</p>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-white">10,000 Tokens</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold">100% Minted Supply</div>
        </div>
      </div>

      {/* Visual Bar Distribution */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden flex p-0.5 border border-white/[0.08]">
          {CAP_TABLE_DATA.map((entry, idx) => (
            <div
              key={idx}
              style={{ width: `${entry.percentage}%`, backgroundColor: entry.color }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:opacity-80 cursor-pointer"
              title={`${entry.holderGroup}: ${entry.percentage}% (${entry.tokens} Tokens)`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
          {CAP_TABLE_DATA.map((entry, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="font-bold text-white">{entry.percentage}%</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-300 truncate">{entry.holderGroup}</div>
              <div className="text-[10px] text-slate-500">{entry.tokens} Tokens ({entry.value})</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
