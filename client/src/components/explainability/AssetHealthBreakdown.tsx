import React from 'react';
import { ShieldCheck, Building2, Coins, Users, Scale, Activity } from 'lucide-react';

export function AssetHealthBreakdown() {
  const factors = [
    { label: 'Legal & Title Deed', score: 98, color: 'bg-emerald-500', text: 'text-emerald-400' },
    { label: 'Financial Yield & Cashflow', score: 91, color: 'bg-indigo-500', text: 'text-indigo-400' },
    { label: 'Occupancy & Tenant Stability', score: 95, color: 'bg-purple-500', text: 'text-purple-400' },
    { label: 'Market Orderbook Liquidity', score: 72, color: 'bg-amber-500', text: 'text-amber-400' },
    { label: 'Governance & DAO Voting', score: 88, color: 'bg-blue-500', text: 'text-blue-400' },
  ];

  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <span className="pill-badge pill-success text-[10px]">Multi-Factor Health</span>
          <h3 className="text-xl font-bold text-white mt-1">Asset Health & Risk Breakdown</h3>
          <p className="text-xs text-slate-400">Institutional 5-factor risk radar analysis.</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-400">Low Risk Overall</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Blended Health 88.8</div>
        </div>
      </div>

      <div className="space-y-4">
        {factors.map((f) => (
          <div key={f.label} className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">{f.label}</span>
              <span className={`font-bold ${f.text}`}>{f.score} / 100</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-white/[0.06]">
              <div
                style={{ width: `${f.score}%` }}
                className={`h-full ${f.color} rounded-full transition-all`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
