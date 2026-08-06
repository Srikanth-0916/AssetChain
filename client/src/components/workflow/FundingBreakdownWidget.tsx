import React from 'react';
import { Target, Users, DollarSign, Clock, TrendingUp, ShieldCheck } from 'lucide-react';

interface FundingBreakdownWidgetProps {
  targetAmount?: number;
  raisedAmount?: number;
  investorsCount?: number;
  expectedCloseDays?: number;
}

export function FundingBreakdownWidget({
  targetAmount = 2500000,
  raisedAmount = 2050000,
  investorsCount = 145,
  expectedCloseDays = 15,
}: FundingBreakdownWidgetProps) {
  const remainingAmount = Math.max(0, targetAmount - raisedAmount);
  const raisePct = Math.round((raisedAmount / targetAmount) * 100);
  const avgInvestment = Math.round(raisedAmount / (investorsCount || 1));

  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <span className="pill-badge pill-success text-[10px]">Capital Raising Engine</span>
          <h3 className="text-xl font-bold text-white mt-1">Funding Progress & Capital Allocation</h3>
          <p className="text-xs text-slate-400">Institutional primary token issuance metrics.</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-emerald-400">{raisePct}% Raised</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold">{expectedCloseDays} Days Remaining</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden p-0.5 border border-white/[0.08]">
          <div
            style={{ width: `${raisePct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-emerald-300 transition-all shadow-md"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>Raised: <strong className="text-white">₹{raisedAmount.toLocaleString('en-IN')}</strong></span>
          <span>Target: <strong className="text-white">₹{targetAmount.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* Detailed Quantitative Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">Remaining Target</div>
          <div className="text-base font-bold text-amber-400">₹{remainingAmount.toLocaleString('en-IN')}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">Institutional Investors</div>
          <div className="text-base font-bold text-white">{investorsCount} Verified</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">Average Check Size</div>
          <div className="text-base font-bold text-indigo-300">₹{avgInvestment.toLocaleString('en-IN')}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">Token Sale Close</div>
          <div className="text-base font-bold text-emerald-400">{expectedCloseDays} Days Left</div>
        </div>
      </div>
    </div>
  );
}
