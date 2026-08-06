/**
 * SystemHealthCard — Displays real-time platform system health.
 *
 * Fetches status from GET /api/v1/system/health and renders live status indicators:
 *   - AI (Gemini)
 *   - Blockchain (Polygon Amoy RPC)
 *   - Supabase Database
 *   - Payments (Razorpay Sandbox)
 *   - Smart Contracts
 *   - Recommendation Engine
 *   - System Uptime
 */

import React, { useEffect, useState } from 'react';
import {
  Activity, CheckCircle2, AlertCircle, RefreshCw,
  Cpu, Database, Shield, CreditCard, Server, Zap
} from 'lucide-react';

interface SystemHealthData {
  gemini: 'healthy' | 'fallback' | 'degraded';
  polygon: 'connected' | 'disconnected';
  supabase: 'healthy' | 'memory_fallback' | 'degraded';
  payments: 'sandbox' | 'live' | 'disabled';
  contracts: 'verified' | 'unverified';
  recommendationEngine: 'healthy' | 'degraded';
  ai: 'healthy' | 'fallback';
  uptime: number;
  timestamp: string;
}

import { API_BASE_URL as API_BASE } from '../../config/network';


function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function SystemHealthCard() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/system/health`);
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      setHealth(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError('Health service unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const items = health ? [
    {
      label: 'AI Copilot (Gemini)',
      status: health.gemini === 'healthy' ? 'Live (Gemini 2.0)' : 'Fallback (Mock)',
      color: health.gemini === 'healthy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      label: 'Polygon Blockchain RPC',
      status: health.polygon === 'connected' ? 'Connected (Amoy)' : 'Disconnected',
      color: health.polygon === 'connected' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30',
      icon: <Server className="w-4 h-4" />,
    },
    {
      label: 'Database (Supabase)',
      status: health.supabase === 'healthy' ? 'Healthy (PostgreSQL)' : 'Dev Memory Fallback',
      color: health.supabase === 'healthy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      icon: <Database className="w-4 h-4" />,
    },
    {
      label: 'Payment Gateway',
      status: health.payments === 'sandbox' ? 'Sandbox Mode (Razorpay)' : 'Live Mode',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      label: 'Smart Contracts',
      status: health.contracts === 'verified' ? 'Verified (6 Contracts)' : 'Unverified',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      label: 'Recommendation Engine',
      status: health.recommendationEngine === 'healthy' ? 'Healthy (Deterministic)' : 'Degraded',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: <Zap className="w-4 h-4" />,
    },
  ] : [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Live System Health</h2>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          title="Refresh System Health"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {items.map((item) => (
              <div key={item.label} className="p-3 bg-gray-800/60 border border-gray-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-gray-400 flex-shrink-0">{item.icon}</div>
                  <span className="text-xs text-gray-300 truncate">{item.label}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ml-2 ${item.color}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
            <span>Uptime: <strong className="text-gray-300">{health ? formatUptime(health.uptime) : '--'}</strong></span>
            <span>Last checked: {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
