import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { TrendingUp, Coins, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function Portfolio() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedMessage, setClaimedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const res = await portfolioService.getPortfolio();
        setData(res);
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const handleClaim = (assetTitle: string, amount: number) => {
    setClaimedMessage(`Successfully claimed $${amount} USDC yield for ${assetTitle}!`);
    setTimeout(() => setClaimedMessage(null), 4000);
  };

  const summary = data?.summary || {
    total_invested: 14200,
    current_value: 15550,
    total_profit_loss: 1350,
    unclaimed_dividends: 470,
  };

  const holdings = data?.holdings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Investor Portfolio & Yield</h1>
        <p className="text-xs text-slate-400">Overview of owned token holdings, accumulated dividends, and voting power</p>
      </div>

      {claimedMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {claimedMessage}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 space-y-2">
          <span className="text-xs text-slate-400">Total Invested</span>
          <div className="text-2xl font-bold text-white">{formatCurrency(summary.total_invested)}</div>
        </div>
        <div className="glass-card p-6 space-y-2">
          <span className="text-xs text-slate-400">Current Valuation</span>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.current_value)}</div>
        </div>
        <div className="glass-card p-6 space-y-2">
          <span className="text-xs text-slate-400">Total Profit / Loss</span>
          <div className="text-2xl font-bold text-indigo-400">+{formatCurrency(summary.total_profit_loss)}</div>
        </div>
        <div className="glass-card p-6 space-y-2">
          <span className="text-xs text-slate-400">Unclaimed Dividends</span>
          <div className="text-2xl font-bold text-amber-400">{formatCurrency(summary.unclaimed_dividends)}</div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Asset Token Holdings</h3>

        {isLoading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading holdings...</div>
        ) : (
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
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {holdings.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="p-3 font-semibold text-white">{inv.asset?.title || 'Tokenized Asset'}</td>
                    <td className="p-3 font-mono">{inv.tokens_owned} ACT</td>
                    <td className="p-3">${inv.average_buy_price}</td>
                    <td className="p-3 text-emerald-400">${inv.asset?.token_price || inv.average_buy_price}</td>
                    <td className="p-3 font-bold text-white">${inv.current_value?.toLocaleString()}</td>
                    <td className="p-3 text-indigo-400 font-semibold">${inv.unclaimed_dividends} USDC</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleClaim(inv.asset?.title || 'Asset', inv.unclaimed_dividends)}
                        className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold hover:bg-emerald-600/30 transition-all"
                      >
                        Claim Dividend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
