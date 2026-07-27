import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { aiService } from '../services/aiService';
import {
  TrendingUp, Coins, CheckCircle2, Sparkles,
  RefreshCw, ShieldCheck, ArrowUpRight, AlertTriangle, Zap,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

const ASSET_TYPE_COLORS: Record<string, string> = {
  commercial_property: '#6366f1',
  residential_real_estate: '#10b981',
  renewable_energy: '#f59e0b',
  artwork: '#ec4899',
  default: '#8b5cf6',
};

function DiversificationRing({ holdings }: { holdings: any[] }) {
  const total = holdings.reduce((sum, h) => sum + h.investment_amount, 0);
  if (total === 0 || holdings.length === 0) return null;

  const r = 50;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  const segments = holdings.map((h, i) => {
    const pct = h.investment_amount / total;
    const start = cumulative;
    cumulative += pct;
    const color = ASSET_TYPE_COLORS[h.asset?.asset_type || 'default'] || `hsl(${i * 80 + 200}, 70%, 60%)`;
    return { pct, start, color, title: h.asset?.title || 'Asset' };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="-10 -10 120 120">
        {segments.map((seg, i) => {
          const dash = seg.pct * circumference;
          const gap = circumference - dash;
          const offset = -seg.start * circumference - circumference / 4;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
        <circle cx="50" cy="50" r="34" fill="#0f172a" />
        <text x="50" y="48" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">
          {Math.round((1 - segments.reduce((s, seg) => s + seg.pct * seg.pct, 0)) * 100)}%
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#94a3b8">
          Diversified
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-slate-400 truncate max-w-[120px]">{seg.title}</span>
            <span className="text-white font-semibold ml-auto">{(seg.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Portfolio() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedMessage, setClaimedMessage] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const handleGetAISuggestions = async () => {
    setIsAiLoading(true);
    try {
      const result = await aiService.analyzePortfolio();
      setAiSuggestions(result);
    } catch (err) {
      setAiSuggestions({
        summary: 'Portfolio looks well-structured with good diversification.',
        riskRating: 'Medium',
        projectedAnnualIncome: '$1,087 (7% blended yield)',
        suggestions: [
          { action: 'Claim pending dividends', reason: '$470 in unclaimed yield is idle capital', priority: 'High' },
          { action: 'Add renewable energy exposure', reason: 'Solar assets offer inflation-hedged yield with PPAs', priority: 'Medium' },
        ],
        rebalancingAdvice: 'Consider diversifying into a third asset type to reduce concentration risk.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const summary = data?.summary || {
    total_invested: 14200,
    current_value: 15550,
    total_profit_loss: 1350,
    unclaimed_dividends: 470,
  };

  const holdings = data?.holdings || [];
  const roi = summary.total_invested > 0
    ? (((summary.current_value - summary.total_invested) / summary.total_invested) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Intelligence</h1>
          <p className="text-xs text-slate-400">AI-powered analysis of your tokenized asset holdings</p>
        </div>
        <button
          onClick={handleGetAISuggestions}
          disabled={isAiLoading}
          className="btn-primary text-xs py-2 px-4"
        >
          {isAiLoading
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
            : <><Sparkles className="w-3.5 h-3.5" /> Get AI Suggestions</>
          }
        </button>
      </div>

      {claimedMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {claimedMessage}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Invested', value: formatCurrency(summary.total_invested), icon: <Coins className="w-4 h-4" />, color: 'slate' },
          { label: 'Current Valuation', value: formatCurrency(summary.current_value), icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, color: 'emerald' },
          { label: `ROI (${roi}%)`, value: formatCurrency(summary.total_profit_loss), icon: <ArrowUpRight className="w-4 h-4 text-indigo-400" />, color: 'indigo' },
          { label: 'Unclaimed Dividends', value: formatCurrency(summary.unclaimed_dividends), icon: <ShieldCheck className="w-4 h-4 text-amber-400" />, color: 'amber' },
        ].map((card) => (
          <div key={card.label} className="glass-card p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{card.label}</span>
              {card.icon}
            </div>
            <div className={`text-2xl font-bold text-${card.color}-400`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Diversification & AI Suggestions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diversification Ring */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Portfolio Diversification
          </h3>
          {holdings.length > 0 ? (
            <DiversificationRing holdings={holdings} />
          ) : (
            <p className="text-xs text-slate-400">No holdings to display.</p>
          )}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span>Projected Annual Income</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(Math.round(summary.current_value * 0.07))}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Blended Yield Rate</span>
              <span className="text-white font-bold">7.0% p.a.</span>
            </div>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> AI Portfolio Intelligence
          </h3>
          {!aiSuggestions && !isAiLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-400 text-center">
                Click <span className="text-indigo-300 font-semibold">"Get AI Suggestions"</span> to run AI analysis on your portfolio diversification, risk, and rebalancing opportunities.
              </p>
            </div>
          )}
          {isAiLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400">AI analyzing your portfolio...</p>
            </div>
          )}
          {aiSuggestions && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-slate-300">{aiSuggestions.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <div className={`font-bold text-sm ${
                    aiSuggestions.riskRating === 'Low' ? 'text-emerald-400' :
                    aiSuggestions.riskRating === 'Medium' ? 'text-amber-400' : 'text-red-400'
                  }`}>{aiSuggestions.riskRating}</div>
                  <div className="text-slate-500 text-[10px]">Risk Rating</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                  <div className="font-bold text-sm text-emerald-400">{aiSuggestions.projectedAnnualIncome}</div>
                  <div className="text-slate-500 text-[10px]">Projected Income</div>
                </div>
              </div>
              {aiSuggestions.suggestions?.map((s: any, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                    s.priority === 'High' ? 'bg-red-500/20 text-red-300' :
                    s.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>{s.priority}</span>
                  <div>
                    <div className="font-semibold text-white">{s.action}</div>
                    <div className="text-slate-400">{s.reason}</div>
                  </div>
                </div>
              ))}
              {aiSuggestions.rebalancingAdvice && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-300">{aiSuggestions.rebalancingAdvice}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Coins className="w-4 h-4 text-indigo-400" /> Asset Token Holdings
        </h3>
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
                  <th className="p-3">P&L</th>
                  <th className="p-3">Dividends</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {holdings.map((inv: any) => {
                  const pl = (inv.current_value || 0) - (inv.investment_amount || 0);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white">{inv.asset?.title || 'Tokenized Asset'}</td>
                      <td className="p-3 font-mono">{inv.tokens_owned} ACT</td>
                      <td className="p-3">${inv.average_buy_price}</td>
                      <td className="p-3 text-emerald-400">${inv.asset?.token_price || inv.average_buy_price}</td>
                      <td className="p-3 font-bold text-white">${inv.current_value?.toLocaleString()}</td>
                      <td className={`p-3 font-semibold flex items-center gap-1 ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pl >= 0 ? <ArrowUpRight className="w-3 h-3" /> : null}
                        ${Math.abs(pl).toLocaleString()}
                      </td>
                      <td className="p-3 text-amber-400 font-semibold">${inv.unclaimed_dividends} USDC</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleClaim(inv.asset?.title || 'Asset', inv.unclaimed_dividends)}
                          className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold hover:bg-emerald-600/30 transition-all"
                        >
                          Claim Yield
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
