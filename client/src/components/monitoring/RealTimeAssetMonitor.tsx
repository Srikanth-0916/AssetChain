import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Radio, ShieldCheck, Zap, Coins, TrendingUp,
  Cpu, Building2, CheckCircle2, Clock, ArrowUpRight, Lock,
  RefreshCw, Globe2, AlertCircle, Wifi, Server
} from 'lucide-react';

interface AssetMonitorProps {
  holdings?: any[];
  userWalletAddress?: string | null;
}

export function RealTimeAssetMonitor({ holdings = [], userWalletAddress }: AssetMonitorProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
  const [liveBlockNumber, setLiveBlockNumber] = useState<number>(34892104);
  const [liveDividendCounter, setLiveDividendCounter] = useState<number>(142.8541);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; time: string; text: string; type: string }>>([
    { id: '1', time: 'Just now', text: 'Polygon Amoy Block #34,892,104 confirmed on-chain', type: 'block' },
    { id: '2', time: '2m ago', text: 'Quarterly rental yield distribution smart contract executed', type: 'yield' },
    { id: '3', time: '5m ago', text: 'Chainlink IoT Oracle: Manhattan Plaza Occupancy verified at 96.8%', type: 'oracle' },
    { id: '4', time: '12m ago', text: 'Sub-registrar title deed hash 0x7a89... verified by legal node', type: 'legal' },
  ]);

  // Live block counter ticker simulation
  useEffect(() => {
    const blockInterval = setInterval(() => {
      setLiveBlockNumber(prev => prev + 1);
      setLiveDividendCounter(prev => prev + 0.00014);

      // Randomly push real-time event logs
      if (Math.random() > 0.6) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const sampleEvents = [
          { text: 'Live rental dividend micro-accrual credited to wallet', type: 'yield' },
          { text: `Polygon Amoy Block #${liveBlockNumber + 1} finalized with 0 gas fee`, type: 'block' },
          { text: 'Chainlink IoT sensor: HVAC & solar telemetry stream normal', type: 'oracle' },
          { text: 'ERC-3643 Transfer Permission Check passed for investor whitelist', type: 'legal' },
        ];
        const randomEvt = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
        setLiveEvents(prev => [
          { id: Date.now().toString(), time: timeStr, text: randomEvt.text, type: randomEvt.type },
          ...prev.slice(0, 5),
        ]);
      }
    }, 3000);

    return () => clearInterval(blockInterval);
  }, [liveBlockNumber]);

  const activeHoldingsCount = holdings.length > 0 ? holdings.length : 3;
  const activeAsset = holdings.find(h => (h.id || h.asset_id) === selectedAssetId);

  return (
    <div className="glass-card p-6 border border-emerald-500/20 space-y-6 relative overflow-hidden">

      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Monitor Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry Feed
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Radio className="w-3 h-3 text-indigo-400" /> Polygon Amoy Block #{liveBlockNumber.toLocaleString()}
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Real-Time Asset Monitoring Workspace
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveConnected(v => !v)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isLiveConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Wifi className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            {isLiveConnected ? 'Websocket Connected' : 'Paused'}
          </button>
        </div>
      </div>

      {/* ── Real-Time Ticking Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Live Accrued Dividend Ticker */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/25 space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> Accrued Yield Stream
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9px] font-mono font-bold">
              LIVE ACCRUAL
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
            ${liveDividendCounter.toFixed(4)}
          </div>
          <div className="text-[10px] text-amber-300/80 font-mono flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> +$0.00014 / 3 seconds accrued
          </div>
        </div>

        {/* IoT Occupancy Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/25 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" /> IoT Occupancy Stream
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[9px] font-mono font-bold">
              VERIFIED
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            96.8% <span className="text-xs font-normal text-emerald-400 font-mono">100% Leased</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" /> Chainlink IoT Telemetry Active
          </div>
        </div>

        {/* Smart Contract Deed Status */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/25 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Legal Deed Health
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-mono font-bold">
              CLEARED
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            Encumbrance Free
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AES-256 Title Deed Verified
          </div>
        </div>

        {/* Polygon Node Block Status */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/25 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-purple-400" /> Polygon Consensus
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[9px] font-mono font-bold">
              SYNCED
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-white tracking-tight truncate">
            Block #{liveBlockNumber.toLocaleString()}
          </div>
          <div className="text-[10px] text-purple-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" /> Avg Block Time: 2.1 sec
          </div>
        </div>
      </div>

      {/* ── Real-Time Sensor Telemetry & Event Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Telemetry Sensor Dashboard */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Asset Sensor Telemetry
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Feed
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { sensor: 'Commercial Building Occupancy', value: '96.8%', status: 'Optimal', icon: '🏬', color: 'text-emerald-400' },
              { sensor: 'Monthly Rent Disbursement Stream', value: '$42,500 / mo', status: 'On-Time', icon: '💵', color: 'text-amber-400' },
              { sensor: 'Solar Energy Generation Output', value: '4.2 kW/h', status: 'Active', icon: '☀️', color: 'text-indigo-400' },
              { sensor: 'Property Insurance & Tax Escrow', value: '100% Funded', status: 'Verified', icon: '🛡️', color: 'text-purple-400' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{s.icon}</span>
                  <div>
                    <div className="font-semibold text-white">{s.sensor}</div>
                    <div className="text-[10px] text-slate-500">{s.status}</div>
                  </div>
                </div>
                <div className={`font-mono font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live On-Chain Event Stream Log */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400 animate-pulse" /> Live On-Chain Event Feed
            </h3>
            <span className="text-[10px] text-slate-400">Auto-refreshing</span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {liveEvents.map((evt) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1 animate-ping" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium leading-tight">{evt.text}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{evt.time}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
}
