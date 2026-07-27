import { TrendingUp, Coins, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function Portfolio() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Investor Portfolio</h1>
        <p className="text-xs text-slate-400">Overview of owned token holdings, accumulated dividends, and voting power</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-2">
          <span className="text-xs text-slate-400">Total Invested</span>
          <div className="text-2xl font-bold text-white">{formatCurrency(15000)}</div>
        </div>
        <div className="glass-card p-6 space-y-2">
          <span className="text-xs text-slate-400">Current Valuation</span>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(16850)}</div>
        </div>
        <div className="glass-card p-6 space-y-2">
          <span className="text-xs text-slate-400">Dividends Claimed</span>
          <div className="text-2xl font-bold text-indigo-400">{formatCurrency(850)}</div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Asset Token Holdings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">Asset Title</th>
                <th className="p-3">Tokens Owned</th>
                <th className="p-3">Avg Buy Price</th>
                <th className="p-3">Current Price</th>
                <th className="p-3">Total Value</th>
                <th className="p-3">Unclaimed Dividends</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="p-3 font-semibold text-white">Manhattan Commercial Plaza</td>
                <td className="p-3 font-mono">40 ACT-1</td>
                <td className="p-3">$250.00</td>
                <td className="p-3 text-emerald-400">$275.00</td>
                <td className="p-3 font-bold text-white">$11,000.00</td>
                <td className="p-3 text-indigo-400 font-semibold">$350.00</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Solar Farm Alpha 1</td>
                <td className="p-3 font-mono">35 ACT-2</td>
                <td className="p-3">$120.00</td>
                <td className="p-3 text-emerald-400">$130.00</td>
                <td className="p-3 font-bold text-white">$4,550.00</td>
                <td className="p-3 text-indigo-400 font-semibold">$120.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
