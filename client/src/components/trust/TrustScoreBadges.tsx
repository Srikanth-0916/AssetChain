import React, { useState } from 'react';
import { Scale, UserCheck, Building2, ShieldCheck, Link, Info } from 'lucide-react';

interface BadgeDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'verified' | 'pending';
  explanation: string;
}

const STATIC_BADGE_DEFINITIONS: Record<string, Omit<BadgeDefinition, 'id' | 'status'>> = {
  legal: {
    name: 'No Legal Disputes Found',
    icon: <Scale className="w-3.5 h-3.5" />,
    explanation: 'Government records and 30-year deed searches confirm there are no outstanding mortgages or court disputes on this property.',
  },
  kyc: {
    name: 'Investment Compliance Verified',
    icon: <UserCheck className="w-3.5 h-3.5" />,
    explanation: 'Satisfies all identity and anti-money laundering requirements (ERC-3643 standard) for secure fractional investment.',
  },
  spv: {
    name: 'Legal Holding Company Registered',
    icon: <Building2 className="w-3.5 h-3.5" />,
    explanation: 'A dedicated Special Purpose Vehicle (SPV) company holds 100% legal title to the property on behalf of token investors.',
  },
  multisig: {
    name: 'Multi-Party Sign-Off Completed',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    explanation: 'Requires consensus approvals (2-of-3 multi-sig) from Independent Auditor, Legal Counsel, and Platform Officers.',
  },
  blockchain: {
    name: 'Ownership Record Secured',
    icon: <Link className="w-3.5 h-3.5" />,
    explanation: 'Government ownership documents and token shares are permanently secured on the Polygon blockchain ledger.',
  },
};

interface TrustScoreBadgesProps {
  activeBadges?: string[];
}

export function TrustScoreBadges({ activeBadges = ['legal', 'kyc', 'spv', 'multisig', 'blockchain'] }: TrustScoreBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {activeBadges.map((key) => {
          const def = STATIC_BADGE_DEFINITIONS[key];
          if (!def) return null;
          const isSelected = selectedBadge === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedBadge(isSelected ? null : key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {def.icon}
              <span>{def.name}</span>
              <Info className="w-3 h-3 text-emerald-400/60" />
            </button>
          );
        })}
      </div>

      {selectedBadge && STATIC_BADGE_DEFINITIONS[selectedBadge] && (
        <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-lg text-xs space-y-1 animate-in fade-in duration-200">
          <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
            {STATIC_BADGE_DEFINITIONS[selectedBadge].icon}
            <span>{STATIC_BADGE_DEFINITIONS[selectedBadge].name}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {STATIC_BADGE_DEFINITIONS[selectedBadge].explanation}
          </p>
        </div>
      )}
    </div>
  );
}
