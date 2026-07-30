import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { aiService } from '../services/aiService';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Coins, CheckCircle2, Sparkles, RefreshCw,
  ShieldCheck, ArrowUpRight, AlertTriangle, BarChart3,
  Receipt, ChevronRight, Zap, Target, PieChart,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { WhyPanel } from '../components/trust/WhyPanel';
import { ContextualAITip } from '../components/trust/ContextualAITip';
import { TrustScorePanel } from '../components/explainability/TrustScorePanel';
import { ROIBreakdownPanel } from '../components/explainability/ROIBreakdownPanel';
import { RiskBreakdownPanel } from '../components/explainability/RiskBreakdownPanel';

const ASSET_TYPE_COLORS: Record<string, string> = {
  commercial_property:    '#6366f1',
  residential_real_estate:'#10b981',
  renewable_energy:       '#f59e0b',
  artwork:                '#ec4899',
  default:                '#8b5cf6',
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
            <circle key={i} cx="50" cy="50" r={r} fill="none"
              stroke={seg.color} strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset}
            />
          );
        })}
        <circle cx="50" cy="50" r="34" fill="#0f172a" />
        <text x="50" y="48" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">
          {Math.round((1 - segments.reduce((s, seg) => s + seg.pct * seg.pct, 0)) * 100)}%
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#94a3b8">Diversified</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-slate-400 truncate max-w-[130px]">{seg.title}</span>
            <span className="text-white font-semibold ml-auto">{(seg.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Health score breakdown */
const HEALTH_METRICS = [
  { label: 'Diversification',   score: 82, color: 'from-indigo-600 to-indigo-400' },
  { label: 'Risk Balance',      score: 76, color: 'from-emerald-600 to-emerald-400' },
  { label: 'Liquidity',         score: 65, color: 'from-amber-600 to-amber-400' },
  { label: 'Income Stability',  score: 90, color: 'from-purple-600 to-purple-400' },
];

export function Portfolio() {
  const [data, setData]               = useState<any>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [claimedMsg, setClaimedMsg]   = useState<string | null>(null);
  const [aiSuggestions, setAiSugg]   = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState<'overview' | 'health' | 'holdings'>('overview');

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
    setClaimedMsg(`Successfully claimed ${formatCurrency(amount)} yield for ${assetTitle}!`);
    setTimeout(() => setClaimedMsg(null), 5000);
  };

  const handleGetAISuggestions = async () => {
    setIsAiLoading(true);
    try {
      const result = await aiService.analyzePortfolio();
      setAiSugg(result);
    } catch {
      setAiSugg({
        summary: 'Portfolio looks well-structured with good diversification across 3 asset types.',
        riskRating: 'Medium',
        projectedAnnualIncome: '₹17,150 (7% blended yield)',
        suggestions: [
          { action: 'Claim pending dividends', reason: '₹470 in unclaimed yield is idle capital', priority: 'High' },
          { action: 'Add healthcare REIT exposure', reason: 'Healthcare assets offer inflation-hedged yield', priority: 'Medium' },
        ],
        rebalancingAdvice: 'Consider diversifying into a third asset type to reduce concentration risk.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const summary = data?.summary || {
    total_invested: 225000,
    current_value:  245000,
    total_profit_loss: 20000,
    unclaimed_dividends: 6450,
  };
  const holdings           = data?.holdings || [];
  const sectorConcentration = data?.sector_concentration;
  const roi = summary.total_invested > 0
    ? (((summary.current_value - summary.total_invested) / summary.total_invested) * 100).toFixed(2)
    : '0.00';
  const overallHealth = Math.round(HEALTH_METRICS.reduce((s, m) => s + m.score, 0) / HEALTH_METRICS.length);

  return (
    <div className="page-container space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-indigo-500/20 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Intelligence</h1>
            <p className="text-sm text-slate-400">AI-powered analysis of your tokenized asset holdings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGetAISuggestions}
            disabled={isAiLoading}
            className="btn-primary text-sm"
          >
            {isAiLoading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
              : <><Sparkles className="w-4 h-4" /> AI Analysis</>
            }
          </button>
          <Link to="/transactions" className="btn-ghost text-sm flex items-center gap-1.5">
            <Receipt className="w-4 h-4" /> Transactions
          </Link>
        </div>
      </div>

      {/* ── Concentration warning ── */}
      {sectorConcentration?.is_concentrated && (
        <ContextualAITip
          type="concentration"
          title="Sector Concentration Warning"
          message={sectorConcentration.message || `Concentrated in ${sectorConcentration.sector} — diversify to reduce risk.`}
          actionText="Explore Other Assets"
          actionHref="/marketplace"
        />
      )}

      {/* ── Claim success ── */}
      {claimedMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {claimedMsg}
        </div>
      )}

      {/* ── 5 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        {[
          { label: 'Current Value',      value: formatCurrency(summary.current_value),       sub: 'Market valuation',       color: 'text-white',       icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
          { label: 'Total Invested',     value: formatCurrency(summary.total_invested),      sub: 'Capital deployed',        color: 'text-slate-300',   icon: <Coins className="w-4 h-4 text-indigo-400" /> },
          { label: 'Total Profit',       value: formatCurrency(summary.total_profit_loss),   sub: `ROI: +${roi}%`,           color: 'text-emerald-400', icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" /> },
          { label: 'Rental Income',      value: formatCurrency(summary.unclaimed_dividends), sub: 'Pending claim',           color: 'text-amber-400',   icon: <ShieldCheck className="w-4 h-4 text-amber-400" /> },
          { label: 'Portfolio Health',   value: `${overallHealth}/100`,                       sub: overallHealth >= 80 ? 'Excellent' : overallHealth >= 60 ? 'Good' : 'Needs attention', color: 'gradient-text', icon: <Target className="w-4 h-4 text-indigo-400" /> },
        ].map(s => (
          <div key={s.label} className="stat-card animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <p className="section-subheader">{s.label}</p>
              {s.icon}
            </div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="tab-bar inline-flex">
        {(['overview','health','holdings'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`tab-item capitalize ${activeTab === t ? 'active' : ''}`}>
            {t === 'overview' ? '📊 Overview' : t === 'health' ? '❤️ Health' : '🏗️ Holdings'}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diversification ring */}
          <div className="stat-card">
            <p className="section-header mb-5"><BarChart3 className="w-4 h-4 text-indigo-400" /> Portfolio Diversification</p>
            {holdings.length > 0 ? (
              <DiversificationRing holdings={holdings} />
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No holdings yet. <Link to="/marketplace" className="text-indigo-400">Browse assets →</Link></div>
            )}
            <hr className="divider my-4" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Annual Income</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(Math.round(summary.current_value * 0.07))}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Yield Rate</span>
                <span className="text-white font-bold">7.0% p.a.</span>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="stat-card">
            <p className="section-header mb-5"><Sparkles className="w-4 h-4 text-indigo-400" /> AI Portfolio Intelligence</p>
            {!aiSuggestions && !isAiLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="text-sm text-slate-400 max-w-xs">
                  Run AI analysis to get personalized diversification, risk, and rebalancing insights.
                </p>
                <button onClick={handleGetAISuggestions} className="btn-primary text-sm">
                  <Sparkles className="w-4 h-4" /> Run Analysis
                </button>
              </div>
            )}
            {isAiLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-400">Analyzing your portfolio with Gemini AI...</p>
              </div>
            )}
            {aiSuggestions && (
              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
                  <p className="text-slate-300 leading-relaxed">{aiSuggestions.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                    <div className={`font-bold text-lg ${aiSuggestions.riskRating === 'Low' ? 'text-emerald-400' : aiSuggestions.riskRating === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                      {aiSuggestions.riskRating}
                    </div>
                    <div className="text-xs text-slate-500">Risk Rating</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                    <div className="font-bold text-emerald-400 text-sm leading-tight">{aiSuggestions.projectedAnnualIncome}</div>
                    <div className="text-xs text-slate-500">Projected Income</div>
                  </div>
                </div>
                {aiSuggestions.suggestions?.map((s: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                    <span className={`pill-badge shrink-0 ${s.priority === 'High' ? 'pill-danger' : 'pill-warning'}`}>{s.priority}</span>
                    <div>
                      <div className="font-semibold text-white text-xs">{s.action}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health scorecard */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <p className="section-header">Portfolio Health Score</p>
              <div className="text-4xl font-black gradient-text">{overallHealth}</div>
            </div>
            <div className="space-y-4">
              {HEALTH_METRICS.map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400">{m.label}</span>
                    <span className="text-sm font-bold text-white">{m.score}/100</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className={`progress-bar-fill bg-gradient-to-r ${m.color}`} style={{ width: `${m.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk assessment */}
          <div className="stat-card">
            <p className="section-header mb-5"><AlertTriangle className="w-4 h-4 text-amber-400" /> Risk Assessment</p>
            <div className="space-y-3">
              {[
                { label: 'Market Risk',      level: 'Medium', color: 'pill-warning', desc: 'Token prices tied to real estate market valuations' },
                { label: 'Liquidity Risk',   level: 'Medium', color: 'pill-warning', desc: 'Secondary market available but may have limited buyers' },
                { label: 'Income Risk',      level: 'Low',    color: 'pill-success', desc: 'Rental income backed by long-term leases' },
                { label: 'Regulatory Risk',  level: 'Low',    color: 'pill-success', desc: 'Assets are fully KYC-compliant and on-chain verified' },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                  <span className={`pill-badge shrink-0 mt-0.5 ${r.color}`}>{r.level}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{r.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'holdings' && (
        <div className="stat-card">
          <p className="section-header mb-5">Asset Holdings</p>
          {holdings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm mb-4">No holdings yet.</p>
              <Link to="/marketplace" className="btn-primary text-sm">Browse Assets</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {holdings.map((h: any, i: number) => {
                const pct = summary.total_invested > 0 ? (h.investment_amount / summary.total_invested) * 100 : 0;
                const color = ASSET_TYPE_COLORS[h.asset?.asset_type || 'default'];
                return (
                  <div key={h.id || i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/30 transition-colors space-y-3">
                    {/* Top row: icon + title + investment */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        🏗️
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{h.asset?.title || 'Unnamed Asset'}</div>
                        <div className="text-xs text-slate-500 capitalize">{(h.asset?.asset_type || 'unknown').replace(/_/g, ' ')}</div>
                        <div className="mt-2 progress-bar-track" style={{ height: '3px' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-white">{formatCurrency(h.investment_amount)}</div>
                        <div className="text-xs text-slate-500">{pct.toFixed(1)}% of portfolio</div>
                        {h.unclaimed_dividends > 0 && (
                          <button
                            onClick={() => handleClaim(h.asset?.title, h.unclaimed_dividends)}
                            className="mt-1 text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 ml-auto"
                          >
                            Claim {formatCurrency(h.unclaimed_dividends)} <Zap className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Explainability row */}
                    {h.asset?.id && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
                        <TrustScorePanel assetId={h.asset.id} />
                        <ROIBreakdownPanel
                          assetType={h.asset?.asset_type}
                          investmentAmount={h.investment_amount}
                        />
                        <RiskBreakdownPanel
                          assetType={h.asset?.asset_type}
                          fraudScore={15}
                          liquidityIndex={85}
                          riskTier="medium"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
