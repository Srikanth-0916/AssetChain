import React from 'react';
import { PartyPopper, Building2, Calendar, FileCheck, CheckCircle } from 'lucide-react';

interface InvestmentConfirmationCardProps {
  assetTitle: string;
  investmentAmount: number;
  tokensPurchased: number;
  tokenSupply?: number;
  nextDistributionDate?: string;
  spvVerified?: boolean;
}

export function InvestmentConfirmationCard({
  assetTitle,
  investmentAmount,
  tokensPurchased,
  tokenSupply = 10000,
  nextDistributionDate = '15 Aug 2026',
  spvVerified = true,
}: InvestmentConfirmationCardProps) {
  const ownershipPct = ((tokensPurchased / tokenSupply) * 100).toFixed(2);

  return (
    <div className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
          <PartyPopper className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Investment Confirmed!</h3>
          <p className="text-xs text-indigo-300">
            You're becoming a fractional owner of <span className="font-semibold text-white">{assetTitle}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total Investment</span>
          <div className="text-sm font-bold text-emerald-400">
            ₹{investmentAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Fractional Ownership</span>
          <div className="text-sm font-bold text-indigo-300">
            {ownershipPct}% <span className="text-xs font-normal text-slate-400">({tokensPurchased} Tokens)</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Next Rental Payout</span>
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{nextDistributionDate}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">SPV Document Status</span>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 pt-0.5">
            <FileCheck className="w-3.5 h-3.5" />
            <span>{spvVerified ? 'Title Audited' : 'In Review'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
