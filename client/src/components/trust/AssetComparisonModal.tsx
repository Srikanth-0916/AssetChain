import React from 'react';
import { X, Scale, Building2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export interface ComparisonAsset {
  id: string;
  title: string;
  location: string;
  type: string;
  tokenPrice: string;
  valuation: string;
  yieldPct: string;
  roiPct: string;
  trustScore: number;
  riskRating: string;
  occupancy: string;
  liquidity: string;
  esgScore: string;
}

const COMPARISON_ASSETS_DATA: ComparisonAsset[] = [
  {
    id: 'a1',
    title: 'Manhattan Commercial Plaza',
    location: 'New York, USA',
    type: 'Commercial Real Estate',
    tokenPrice: '$285.50',
    valuation: '$2,500,000',
    yieldPct: '8.20% p.a.',
    roiPct: '+14.2%',
    trustScore: 94,
    riskRating: 'Low Risk',
    occupancy: '98.5%',
    liquidity: 'High Liquidity',
    esgScore: 'A+ (BREEAM Certified)',
  },
  {
    id: 'a2',
    title: 'Solar Farm Grid Alpha 1',
    location: 'Valencia, Spain',
    type: 'Renewable Energy',
    tokenPrice: '$131.40',
    valuation: '$1,200,000',
    yieldPct: '9.50% p.a.',
    roiPct: '+9.5%',
    trustScore: 91,
    riskRating: 'Low Risk',
    occupancy: '100% PPA Active',
    liquidity: 'Medium Liquidity',
    esgScore: 'AAA (Net Zero Carbon)',
  },
  {
    id: 'a3',
    title: 'Luxury Villa Compound',
    location: 'Dubai Marina, UAE',
    type: 'Residential Real Estate',
    tokenPrice: '$486.00',
    valuation: '$4,500,000',
    yieldPct: '7.80% p.a.',
    roiPct: '+8.0%',
    trustScore: 89,
    riskRating: 'Medium Risk',
    occupancy: '92.0%',
    liquidity: 'High Liquidity',
    esgScore: 'A (Green Built)',
  },
];

interface AssetComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssetComparisonModal({ isOpen, onClose }: AssetComparisonModalProps) {
  if (!isOpen) return null;

  const metrics = [
    { label: 'Asset Type', key: 'type' },
    { label: 'Location', key: 'location' },
    { label: 'Token Price', key: 'tokenPrice' },
    { label: 'Total Valuation', key: 'valuation' },
    { label: 'Annualized Yield', key: 'yieldPct' },
    { label: 'Historical ROI', key: 'roiPct' },
    { label: 'Trust Score', key: 'trustScore' },
    { label: 'Risk Rating', key: 'riskRating' },
    { label: 'Occupancy Rate', key: 'occupancy' },
    { label: 'Market Liquidity', key: 'liquidity' },
    { label: 'ESG Rating', key: 'esgScore' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill-badge pill-success text-[10px]">Comparison Engine</span>
              <span className="text-xs text-slate-400">Side-by-side Institutional Audit</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Asset Comparison Matrix</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="py-4 px-4 text-slate-400 font-bold uppercase text-[10px] w-44">Institutional Metric</th>
                {COMPARISON_ASSETS_DATA.map(asset => (
                  <th key={asset.id} className="py-4 px-4 min-w-[220px]">
                    <div className="font-bold text-white text-sm">{asset.title}</div>
                    <div className="text-[11px] text-indigo-400 font-normal">{asset.location}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {metrics.map(m => (
                <tr key={m.key} className="hover:bg-slate-950/60">
                  <td className="py-3.5 px-4 font-semibold text-slate-400 bg-slate-950/40">{m.label}</td>
                  {COMPARISON_ASSETS_DATA.map(asset => {
                    const val = (asset as any)[m.key];
                    const isHighlight = m.key === 'yieldPct' || m.key === 'trustScore';
                    return (
                      <td key={asset.id} className="py-3.5 px-4">
                        {m.key === 'trustScore' ? (
                          <span className="font-bold text-emerald-400">{val} / 100</span>
                        ) : m.key === 'yieldPct' ? (
                          <span className="font-bold text-indigo-300">{val}</span>
                        ) : (
                          <span className="text-slate-200 font-medium">{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
          <button onClick={onClose} className="btn-secondary text-xs py-2 px-5">
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
