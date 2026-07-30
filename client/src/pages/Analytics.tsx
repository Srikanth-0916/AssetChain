import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Building2, DollarSign, ShieldAlert,
  Vote, Zap, Activity, BarChart3, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { analyticsService } from '../services/platformServices';
import { formatCurrency } from '../lib/utils';

const ASSET_TYPE_COLORS: Record<string, string> = {
  commercial_property: '#6366f1',
  residential_real_estate: '#10b981',
  renewable_energy: '#f59e0b',
  artwork: '#ec4899',
  luxury_collectibles: '#8b5cf6',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  commercial_property: 'Commercial',
  residential_real_estate: 'Residential',
  renewable_energy: 'Renewable Energy',
  artwork: 'Artwork',
  luxury_collectibles: 'Luxury',
};

function MiniSparkline({ data }: { data: { date: string; volume: number }[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.volume));
  const min = Math.min(...data.map((d) => d.volume));
  const range = max - min || 1;
  const h = 40;
  const w = 180;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.volume - min) / range) * h;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${h} ${points.join(' ')} ${w},${h}`}
        fill="url(#sparkGrad)"
        stroke="none"
      />
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="w-24 h-24 rounded-full bg-slate-800" />;

  let cumulative = 0;
  const segments = Object.entries(data).map(([key, count]) => {
    const pct = count / total;
    const start = cumulative;
    cumulative += pct;
    return { key, count, pct, start };
  });

  const r = 40;
  const cx = 48;
  const cy = 48;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96">
        {segments.map((seg, i) => {
          const dash = seg.pct * circumference;
          const gap = circumference - dash;
          const offset = -seg.start * circumference - circumference / 4;
          return (
            <circle
              key={seg.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={ASSET_TYPE_COLORS[seg.key] || '#6366f1'}
              strokeWidth="16"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
        <circle cx={cx} cy={cy} r="28" fill="#0f172a" />
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="7" fill="#94a3b8">
          Assets
        </text>
      </svg>
      <div className="space-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-[10px]">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: ASSET_TYPE_COLORS[seg.key] || '#6366f1' }}
            />
            <span className="text-slate-400">{ASSET_TYPE_LABELS[seg.key] || seg.key}</span>
            <span className="text-white font-semibold">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Analytics() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await analyticsService.getOverview();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (isLoading && !data) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="skeleton w-11 h-11 rounded-xl" />
            <div>
              <div className="skeleton w-44 h-5 rounded mb-2" />
              <div className="skeleton w-64 h-3 rounded" />
            </div>
          </div>
          <div className="skeleton w-24 h-9 rounded-xl" />
        </div>
        {/* KPI skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card space-y-3">
              <div className="skeleton w-24 h-3 rounded" />
              <div className="skeleton w-32 h-6 rounded" />
              <div className="skeleton w-16 h-3 rounded" />
            </div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card h-64" />
          ))}
        </div>
      </div>
    );
  }

  const ov = data?.overview || {};

  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon bg-indigo-500/10 border border-indigo-500/20">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="page-title">Platform Analytics</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time intelligence · Updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="btn-secondary text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Value Locked', value: formatCurrency(ov.totalValueLocked), icon: <DollarSign className="w-4 h-4" />, change: '+12.4%', up: true, color: 'text-indigo-400' },
          { label: 'Total Assets', value: `${ov.totalAssets || 0} Listed`, icon: <Building2 className="w-4 h-4" />, change: `${ov.tokenizedAssets || 0} Tokenized`, up: true, color: 'text-emerald-400' },
          { label: 'Platform Users', value: `${ov.totalUsers || 0} Registered`, icon: <Users className="w-4 h-4" />, change: `${ov.activeInvestors || 0} Investors`, up: true, color: 'text-violet-400' },
          { label: 'Platform Revenue', value: formatCurrency(ov.totalPlatformRevenue), icon: <TrendingUp className="w-4 h-4" />, change: '2.5% fee rate', up: true, color: 'text-amber-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="section-subheader">{kpi.label}</span>
              <span className={kpi.color}>{kpi.icon}</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">{kpi.value}</div>
            <div className={`text-[11px] flex items-center gap-1 ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Investment Trend */}
        <div className="md:col-span-2 glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Investment Volume (7 Days)
          </h3>
          {data?.investmentTrend && (
            <div className="space-y-2">
              <div className="flex items-end gap-1.5 h-28">
                {data.investmentTrend.map((d: any, i: number) => {
                  const max = Math.max(...data.investmentTrend.map((x: any) => x.volume));
                  const pct = (d.volume / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-700"
                        style={{ height: `${pct}%`, minHeight: 4 }}
                        title={`$${d.volume.toLocaleString()}`}
                      />
                      <span className="text-[9px] text-slate-500">{d.date.split(' ')[1]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-800 pt-3">
                {data.investmentTrend.slice(-3).map((d: any, i: number) => (
                  <div key={i} className="text-center">
                    <div className="text-slate-400 text-[10px]">{d.date}</div>
                    <div className="text-white font-semibold">${(d.volume / 1000).toFixed(0)}K</div>
                    <div className="text-indigo-400 text-[10px]">{d.transactions} txns</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Asset Distribution */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Asset Distribution
          </h3>
          {data?.assetTypeBreakdown && (
            <DonutChart data={data.assetTypeBreakdown} />
          )}
        </div>
      </div>

      {/* Data Tables Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Assets */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Top Performing Assets
          </h3>
          <div className="space-y-2">
            {data?.topAssets?.map((asset: any, i: number) => (
              <div key={asset.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-white">{asset.title}</div>
                    <div className="text-slate-400 text-[10px]">{asset.location}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">{asset.roi}% ROI</div>
                  <div className="text-slate-400 text-[10px]">{formatCurrency(asset.valuation)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DAO & Fraud */}
        <div className="space-y-4">
          {/* DAO Stats */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Vote className="w-4 h-4 text-purple-400" /> DAO Activity
            </h3>
            {data?.daoStats && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Total Proposals', value: data.daoStats.totalProposals },
                  { label: 'Active Now', value: data.daoStats.activeProposals },
                  { label: 'Votes For', value: data.daoStats.totalVotesFor.toLocaleString() },
                  { label: 'Participation', value: data.daoStats.participationRate },
                ].map((s) => (
                  <div key={s.label} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">{s.label}</div>
                    <div className="text-white font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fraud Alerts */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Fraud Alerts
            </h3>
            {data?.fraudAlerts?.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4" /> No active fraud alerts
              </div>
            ) : (
              data?.fraudAlerts?.map((alert: any) => (
                <div key={alert.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                  <div className="flex items-center gap-2 text-red-300 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> {alert.type}
                  </div>
                  <div className="text-slate-400 mt-1">{alert.assetTitle}</div>
                  <div className="text-slate-500 text-[10px] flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.detectedAt).toLocaleDateString()}
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">{alert.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gas Analytics */}
          {data?.gasAnalytics && (
            <div className="glass-card p-5 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Gas Analytics (Polygon)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Avg Gas Cost</div>
                  <div className="text-white font-bold">${data.gasAnalytics.avgGasCostUSD}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Gas Price</div>
                  <div className="text-emerald-400 font-bold">{data.gasAnalytics.polygonGasPrice}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Total Txns</div>
                  <div className="text-white font-bold">{data.gasAnalytics.totalTransactions.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Network</div>
                  <div className="text-emerald-400 font-bold">{data.gasAnalytics.networkCongestion}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KYC Queue */}
      {data?.kycStats && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> KYC Verification Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Pending Review', value: data.kycStats.pending, color: 'amber' },
              { label: 'Approved', value: data.kycStats.approved, color: 'emerald' },
              { label: 'Rejected', value: data.kycStats.rejected, color: 'red' },
              { label: 'Avg Review Time', value: data.kycStats.avgReviewTime, color: 'indigo' },
            ].map((stat) => (
              <div key={stat.label} className={`p-4 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 text-center`}>
                <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                <div className="text-slate-400 text-[10px] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
