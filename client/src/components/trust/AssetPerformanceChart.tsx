import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, BarChart3, LineChart, DollarSign, Calendar } from 'lucide-react';

export function AssetPerformanceChart() {
  const [metric, setMetric] = useState<'price' | 'yield' | 'occupancy' | 'valuation'>('price');
  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y' | 'ALL'>('1Y');

  const METRICS_DATA = {
    price: { label: 'Token Price ($)', current: '$285.50', growth: '+14.2%', chart: [250, 255, 262, 270, 278, 285.50] },
    yield: { label: 'Annualized Yield (%)', current: '8.20% p.a.', growth: '+0.4%', chart: [7.8, 7.9, 8.0, 8.1, 8.15, 8.20] },
    occupancy: { label: 'Occupancy Rate (%)', current: '98.5%', growth: '+2.1%', chart: [94, 95, 96.5, 97, 98, 98.5] },
    valuation: { label: 'Property Valuation ($)', current: '$2,500,000', growth: '+8.5%', chart: [2300000, 2350000, 2400000, 2450000, 2500000] },
  };

  const selected = METRICS_DATA[metric];

  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <span className="pill-badge pill-success text-[10px]">Financial Analytics</span>
          <h3 className="text-xl font-bold text-white mt-1">Asset Performance & Stock Metrics</h3>
          <p className="text-xs text-slate-400">Institutional historical tracking for token price, yield growth, and property valuation.</p>
        </div>

        <div className="flex items-center gap-2">
          {['1M', '6M', '1Y', 'ALL'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${timeframe === tf ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(METRICS_DATA) as Array<keyof typeof METRICS_DATA>).map((key) => {
          const item = METRICS_DATA[key];
          const isSelected = metric === key;
          return (
            <div
              key={key}
              onClick={() => setMetric(key)}
              className={`p-3.5 rounded-2xl cursor-pointer transition-all border
                ${isSelected ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-lg' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-indigo-500/20'}`}
            >
              <div className="text-[11px] font-medium text-slate-400">{item.label}</div>
              <div className="text-base font-bold text-white mt-1">{item.current}</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">{item.growth}</div>
            </div>
          );
        })}
      </div>

      {/* Graphical Performance Representation */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Trendline: <strong className="text-white">{selected.label}</strong></span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {selected.growth} Growth Window
          </span>
        </div>

        {/* Visual Trend Bars */}
        <div className="h-32 flex items-end justify-between gap-3 pt-4 border-b border-white/[0.06]">
          {selected.chart.map((val, idx) => {
            const min = Math.min(...selected.chart);
            const max = Math.max(...selected.chart);
            const pct = Math.max(20, Math.round(((val - min) / (max - min || 1)) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  {val}
                </div>
                <div
                  style={{ height: `${pct}%` }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-emerald-400 group-hover:from-indigo-500 group-hover:to-emerald-300 transition-all shadow-md"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
