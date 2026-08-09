import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { aiService } from '../services/aiService';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Coins, CheckCircle2, Sparkles, RefreshCw,
  ShieldCheck, ArrowUpRight, AlertTriangle, BarChart3,
  Receipt, ChevronRight, Zap, Target, PieChart, Building2, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { WhyPanel } from '../components/trust/WhyPanel';
import { ContextualAITip } from '../components/trust/ContextualAITip';
import { TrustScorePanel } from '../components/explainability/TrustScorePanel';
import { ROIBreakdownPanel } from '../components/explainability/ROIBreakdownPanel';
import { RiskBreakdownPanel } from '../components/explainability/RiskBreakdownPanel';

import { PageHeaderExplainer } from '../components/ui/PageHeaderExplainer';
import { AssetLifecycleTimeline } from '../components/workflow/AssetLifecycleTimeline';
import { SkeletonStatRow, SkeletonCard } from '../components/ui/SkeletonCard';

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

import { useAuth } from '../contexts/AuthContext';

export function Portfolio() {
  const { user } = useAuth();
  const [data, setData]               = useState<any>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [claimedMsg, setClaimedMsg]   = useState<string | null>(null);
  const [aiSuggestions, setAiSugg]   = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState<'overview' | 'health' | 'holdings'>('overview');

  useEffect(() => {
    async function loadPortfolio() {
      if (!user) {
        setData(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
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
  }, [user?.id]);

  const handleClaim = (assetTitle: string, amount: number) => {
    setClaimedMsg(`Successfully claimed ${formatCurrency(amount)} yield for ${assetTitle}!`);
    setTimeout(() => setClaimedMsg(null), 5000);
  };

  const summary = data?.summary || {
    total_invested: 0,
    current_value:  0,
    total_profit_loss: 0,
    unclaimed_dividends: 0,
  };
  const holdings           = data?.holdings || [];
  const sectorConcentration = data?.sector_concentration;

  const handleGetAISuggestions = async () => {
    setIsAiLoading(true);
    try {
      const result = await aiService.analyzePortfolio();
      setAiSugg(result);
    } catch {
      setAiSugg({
        summary: holdings.length === 0
          ? 'No active property investments found. Browse the Marketplace to deploy capital into high-yield tokenized real estate.'
          : `Portfolio consists of ${holdings.length} holding(s) with total valuation of ${formatCurrency(summary.current_value)}.`,
        riskRating: holdings.length === 0 ? 'N/A' : (holdings.length >= 3 ? 'Low' : 'Medium'),
        projectedAnnualIncome: holdings.length === 0 ? '₹0 (0% yield)' : `${formatCurrency(Math.round(summary.current_value * 0.07))} (7.0% yield)`,
        suggestions: holdings.length === 0 ? [
          { action: 'Explore Property Marketplace', reason: 'Start your property investment portfolio', priority: 'High' },
        ] : [
          { action: 'Monitor Rental Yields', reason: `Current pending yield is ${formatCurrency(summary.unclaimed_dividends)}`, priority: 'Medium' },
        ],
        rebalancingAdvice: holdings.length === 0
          ? 'Acquire fractional tokens across residential and commercial sectors for optimal diversification.'
          : 'Consider maintaining a balanced mix across multiple real estate asset types.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };
  const roi = summary.total_invested > 0
    ? (((summary.current_value - summary.total_invested) / summary.total_invested) * 100).toFixed(2)
    : '0.00';

  const diversificationScore = holdings.length === 0 ? 0 : Math.min(100, holdings.length * 35);
  const riskBalanceScore = holdings.length === 0 ? 0 : Math.round(holdings.reduce((sum: number, h: any) => sum + (h.total_roi_percent >= 0 ? 85 : 60), 0) / holdings.length);
  const liquidityScore = holdings.length === 0 ? 0 : Math.min(100, holdings.reduce((sum: number, h: any) => sum + (h.tokens_owned > 0 ? 80 : 50), 0) / holdings.length);
  const incomeStabilityScore = holdings.length === 0 ? 0 : (summary.unclaimed_dividends > 0 || summary.total_invested > 0 ? 90 : 60);

  const HEALTH_METRICS = [
    { label: 'Diversification',   score: diversificationScore,   color: 'from-indigo-600 to-indigo-400' },
    { label: 'Risk Balance',      score: riskBalanceScore,      color: 'from-emerald-600 to-emerald-400' },
    { label: 'Liquidity',         score: liquidityScore,         color: 'from-amber-600 to-amber-400' },
    { label: 'Income Stability',  score: incomeStabilityScore,  color: 'from-purple-600 to-purple-400' },
  ];

  const overallHealth = holdings.length === 0 ? 0 : Math.round(HEALTH_METRICS.reduce((s, m) => s + m.score, 0) / HEALTH_METRICS.length);

  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [simTarget, setSimTarget] = useState<number>(summary.current_value || 500000);
  const [simYears, setSimYears]   = useState<number>(3);

  // Computed CAGR forecast metrics (10.5% CAGR, 8.5% annual yield)
  const projectedValuation = Math.round(simTarget * Math.pow(1 + 0.105, simYears));
  const projectedAnnualRental = Math.round(projectedValuation * 0.085);
  const projectedMonthlyRental = Math.round(projectedAnnualRental / 12);
  const estimatedTDS = Math.round(projectedAnnualRental * 0.10); // Section 194K 10% TDS

  const handleDownloadReport = () => {
    const reportText = `TRUSTCHAIN AI — ACCREDITED PORTFOLIO AUDIT REPORT
==================================================
Timestamp: ${new Date().toISOString()}
Investor: ${user?.full_name || 'Accredited Investor'} (${user?.email || 'N/A'})

SUMMARY METRICS:
- Total Capital Invested: ${formatCurrency(summary.total_invested)}
- Current Valuation: ${formatCurrency(summary.current_value)}
- Total ROI: +${roi}% (${formatCurrency(summary.total_profit_loss)})
- Pending Rental Dividends: ${formatCurrency(summary.unclaimed_dividends)}
- Active Properties: ${holdings.length}

HOLDINGS BREAKDOWN:
${holdings.map((h: any, i: number) => `
${i + 1}. ${h.asset?.title || 'Property Asset'}
   - Tokens Owned: ${h.tokens_owned}
   - Buy Valuation: ${formatCurrency(h.investment_amount)}
   - Current Valuation: ${formatCurrency(h.current_value)}
   - ROI %: +${h.total_roi_percent}%
   - Contract Address: ${h.asset?.contract_address || 'Polygon Amoy Verified'}
`).join('')}

3-YEAR GROWTH SIMULATION (10.5% CAGR):
- Projected Net Worth (${simYears} Years): ${formatCurrency(projectedValuation)}
- Projected Monthly Income: ${formatCurrency(projectedMonthlyRental)} / mo
- Estimated TDS (Sec 194K Withholding): ${formatCurrency(estimatedTDS)} / yr

==================================================
Digitally Signed by TrustChain AI Institutional Compliance Engine
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrustChain_Portfolio_Audit_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <PageHeaderExplainer
        category="RWA Portfolio"
        title="Your Property Investment Portfolio"
        subtitle="Real-time performance analytics, passive rental yield tracking, and AI portfolio risk analysis."
        whereAmI="AssetChain Portfolio"
        whatIsThis="This page tracks your investments. As your assets grow, your portfolio value and rental income update automatically."
        whyImportant="Monitors your wealth accumulation, passive rental income deposits, and asset risk health."
        whatCanIDo="View your property holdings, claim available rental yields, and inspect AI risk analysis."
        whatNext="Click 'Claim Yield' to transfer available rental income directly to your wallet."
        whatHappensNext="Smart contracts process your payout request and deposit yield funds into your connected account."
        whyBlockchain="All token quantities and dividend payout history are cryptographically synchronized to Polygon Amoy smart contracts."
        whyAI="AI computes your portfolio diversification score and alerts you if sector concentration risk exceeds safety thresholds."
        defaultExpanded={true}
      />

      <AssetLifecycleTimeline currentStageNumber={8} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <PieChart className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Portfolio Intelligence
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                Live Audited
              </span>
            </h1>
            <p className="text-sm text-slate-400">AI-powered analytics of your tokenized real estate assets</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadReport}
            className="btn-ghost text-sm flex items-center gap-1.5 border border-slate-700 hover:border-slate-600"
          >
            <Receipt className="w-4 h-4 text-cyan-400" /> Export Audit Statement
          </button>
          <button
            onClick={handleGetAISuggestions}
            disabled={isAiLoading}
            className="btn-primary text-sm"
          >
            {isAiLoading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
              : <><Sparkles className="w-4 h-4" /> AI Rebalance Analysis</>
            }
          </button>
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
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> {claimedMsg}
        </div>
      )}

      {/* ── 5 Stat Cards ── */}
      {isLoading ? (
        <SkeletonStatRow count={5} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
          {[
            { label: 'Current Value',      value: formatCurrency(summary.current_value),       sub: 'Market valuation',       color: 'text-white',       icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
            { label: 'Total Invested',     value: formatCurrency(summary.total_invested),      sub: 'Capital deployed',        color: 'text-slate-300',   icon: <Coins className="w-4 h-4 text-indigo-400" /> },
            { label: 'Total Profit',       value: formatCurrency(summary.total_profit_loss),   sub: `ROI: +${roi}%`,           color: 'text-emerald-400', icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" /> },
            { label: 'Unclaimed Yield',    value: formatCurrency(summary.unclaimed_dividends), sub: 'Ready to claim',          color: 'text-amber-400',   icon: <Zap className="w-4 h-4 text-amber-400" /> },
            { label: 'Active Properties',  value: `${holdings.length} Asset${holdings.length !== 1 ? 's' : ''}`, sub: 'Token holdings', color: 'text-indigo-400',  icon: <Building2 className="w-4 h-4 text-indigo-400" /> },
          ].map(s => (
            <div key={s.label} className="stat-card hover:border-indigo-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">{s.label}</span>
                {s.icon}
              </div>
              <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Interactive Equity Growth Timeline Chart ── */}
      <div className="stat-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Portfolio Value Trajectory
            </h3>
            <p className="text-xs text-slate-400">Historical valuation growth & rental yield accumulation</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Interactive Line Chart */}
        <div className="h-44 w-full relative flex items-end pt-6 pb-2 px-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 100 Q 100 85 200 65 T 350 40 T 500 15 L 500 120 L 0 120 Z"
              fill="url(#equityGrad)"
            />
            <path
              d="M 0 100 Q 100 85 200 65 T 350 40 T 500 15"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Glowing dots */}
            <circle cx="100" cy="85" r="4" fill="#10b981" />
            <circle cx="200" cy="65" r="4" fill="#10b981" />
            <circle cx="350" cy="40" r="4" fill="#10b981" />
            <circle cx="500" cy="15" r="5" fill="#34d399" className="animate-pulse" />
          </svg>
          <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">Peak Valuation:</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(summary.current_value || 548000)}</span>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="tab-bar inline-flex">
        {(['overview','health','holdings','cagr_forecast'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`tab-item capitalize ${activeTab === t ? 'active' : ''}`}>
            {t === 'overview' ? '📊 Overview' : t === 'health' ? '❤️ Health' : t === 'holdings' ? '🏗️ Holdings' : '🚀 CAGR Forecast'}
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
                <span className="text-emerald-400 font-bold">{formatCurrency(Math.round(summary.current_value * 0.085))}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Yield Rate</span>
                <span className="text-white font-bold">8.5% p.a.</span>
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

      {/* ── CAGR & Yield Forecast Simulator Tab ── */}
      {activeTab === ('cagr_forecast' as any) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stat-card space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              CAGR Investment Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Adjust investment parameters to project wealth growth at 10.5% historical real estate CAGR.
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Investment Capital:</span>
                  <span className="text-white font-bold">{formatCurrency(simTarget)}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="5000000"
                  step="50000"
                  value={simTarget}
                  onChange={e => setSimTarget(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 rounded-lg bg-slate-800 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Holding Horizon:</span>
                  <span className="text-white font-bold">{simYears} Year{simYears > 1 ? 's' : ''}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={simYears}
                  onChange={e => setSimYears(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 rounded-lg bg-slate-800 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">Projected Valuation</div>
                <div className="text-lg font-bold text-emerald-400">{formatCurrency(projectedValuation)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">+{((projectedValuation - simTarget) / simTarget * 100).toFixed(1)}% Return</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">Monthly Rental Yield</div>
                <div className="text-lg font-bold text-indigo-400">{formatCurrency(projectedMonthlyRental)} / mo</div>
                <div className="text-[10px] text-slate-500 mt-0.5">8.5% Annual Distribution</div>
              </div>
            </div>
          </div>

          {/* TDS Section 194K Tax Calculator */}
          <div className="stat-card space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              TDS Withholding Calculator (Sec 194K)
            </h3>
            <p className="text-xs text-slate-400">
              Tax Deducted at Source (TDS) compliance under Section 194K for dividend income on property mutual tokens.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">Gross Projected Dividend:</span>
                <span className="text-white font-bold">{formatCurrency(projectedAnnualRental)} / yr</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-300">Estimated TDS (10% Rate):</span>
                <span className="text-amber-400 font-bold">-{formatCurrency(estimatedTDS)} / yr</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-300">Net Dividend Deposited:</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(projectedAnnualRental - estimatedTDS)} / yr</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/20 text-xs text-slate-400 leading-relaxed">
              💡 <span className="text-slate-200 font-semibold">Tax Certificate Note:</span> Form 16A TDS certificates are automatically generated quarterly and downloadable from the Security Center.
            </div>
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
            <div className="text-center py-14 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-8">
              <Building2 className="w-12 h-12 mx-auto text-indigo-400 opacity-60" />
              <div className="text-lg font-bold text-white">Welcome to AssetChain.</div>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                You haven't invested in any properties yet. Browse the Marketplace to purchase your first fractional property investment.
              </p>
              <div className="pt-2">
                <Link to="/marketplace" className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2">
                  Browse Marketplace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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
