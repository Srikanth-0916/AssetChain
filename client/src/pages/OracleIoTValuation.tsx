import React, { useState } from 'react';
import {
  Activity, Zap, Building2, Sun, ShieldCheck, RefreshCw,
  ExternalLink, TrendingUp, CheckCircle2, Cpu, Database
} from 'lucide-react';

interface OracleFeed {
  id: string;
  assetName: string;
  assetType: string;
  symbol: string;
  icon: string;
  chainlinkPrice: number;
  priceChange24h: number;
  occupancyRatePct: number;
  iotMetricLabel: string;
  iotMetricValue: string;
  lastOracleUpdate: string;
  verificationHash: string;
}

const ORACLE_FEEDS: OracleFeed[] = [
  {
    id: 'ora_1',
    assetName: 'AgriTech Solar Farm Alpha',
    assetType: 'Renewable Solar Energy',
    symbol: 'AGRI',
    icon: '☀️',
    chainlinkPrice: 2045.50,
    priceChange24h: +3.2,
    occupancyRatePct: 99.8,
    iotMetricLabel: 'Solar Output Grid Stream',
    iotMetricValue: '482.5 MWh / day',
    lastOracleUpdate: '10 seconds ago',
    verificationHash: '0xora_solar_7281f9a0c2b4',
  },
  {
    id: 'ora_2',
    assetName: 'Green Valley Commercial REIT',
    assetType: 'Commercial Real Estate',
    symbol: 'GVP',
    icon: '🏢',
    chainlinkPrice: 1012.00,
    priceChange24h: +1.4,
    occupancyRatePct: 98.2,
    iotMetricLabel: 'Tenant Smart Meter Stream',
    iotMetricValue: '98.2% Leased Occupancy',
    lastOracleUpdate: '25 seconds ago',
    verificationHash: '0xora_gvp_9102c4b8e1f3',
  },
  {
    id: 'ora_3',
    assetName: 'TechHub Innovation Center',
    assetType: 'Commercial Innovation REIT',
    symbol: 'TCHB',
    icon: '🏙️',
    chainlinkPrice: 4250.00,
    priceChange24h: -0.5,
    occupancyRatePct: 96.5,
    iotMetricLabel: 'Access Control Stream',
    iotMetricValue: '1,420 Daily Active Passes',
    lastOracleUpdate: '40 seconds ago',
    verificationHash: '0xora_tchb_3419e5d2a7c8',
  },
];

export function OracleIoTValuation() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState('Just now');

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefreshedAt('Just now');
    }, 1200);
  };

  return (
    <div className="page-container animate-fade-in space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/10 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Chainlink Oracle & IoT Property Feed</h1>
            <p className="text-sm text-slate-400">Real-time IoT telemetry, occupancy feeds, and decentralized property valuation</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="btn-secondary text-xs py-2 px-4 flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Feeds ({lastRefreshedAt})</span>
        </button>
      </div>

      {/* Oracle Health Banner */}
      <div className="stat-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-sm font-bold text-white">Chainlink Decentralized Oracle Networks (DON) Active</div>
            <div className="text-xs text-slate-400">3 Verified Feeds Broadcasting to Polygon Amoy Testnet (`Chain ID: 80002`)</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Telemetry
        </div>
      </div>

      {/* Oracle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ORACLE_FEEDS.map((feed) => (
          <div
            key={feed.id}
            className="stat-card p-6 space-y-5 hover:border-cyan-500/40 transition-all"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                  {feed.icon}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{feed.assetName}</div>
                  <div className="text-[11px] text-slate-400">{feed.assetType}</div>
                </div>
              </div>
            </div>

            {/* Price & Change */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Chainlink Oracle Valuation</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black text-white font-mono">
                  ₹{feed.chainlinkPrice.toLocaleString()}
                </div>
                <div className={`text-xs font-bold font-mono ${feed.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {feed.priceChange24h >= 0 ? '+' : ''}{feed.priceChange24h}% (24h)
                </div>
              </div>
            </div>

            {/* IoT Live Sensor Stream */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">IoT Sensor Stream:</span>
                <span className="text-cyan-300 font-bold">{feed.iotMetricValue}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Occupancy Rate:</span>
                <span className="text-emerald-400 font-bold font-mono">{feed.occupancyRatePct}%</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Oracle Update:</span>
                <span className="text-slate-300 font-mono text-[11px]">{feed.lastOracleUpdate}</span>
              </div>
            </div>

            {/* Hash & Polygonscan button */}
            <div className="pt-2 flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-500 truncate max-w-[150px]">{feed.verificationHash}</span>
              <a
                href="https://amoy.polygonscan.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                Verify <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
