import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, TrendingUp, Coins, Vote, Vault, ShoppingCart,
  ShieldCheck, Users, Cpu, ArrowUpRight, ExternalLink,
  RefreshCw, Search, Filter, X, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertTriangle, XCircle, Info,
  Loader2, Hash,
} from 'lucide-react';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityCategory =
  | 'investment' | 'token_mint' | 'dao_vote' | 'treasury_claim'
  | 'marketplace' | 'asset_approval' | 'kyc' | 'nominee' | 'system';

type ActivityStatus = 'confirmed' | 'pending' | 'failed' | 'info';

interface ActivityEvent {
  id: string;
  category: ActivityCategory;
  title: string;
  subtitle: string;
  status: ActivityStatus;
  timestamp: string;
  txHash?: string;
  blockNumber?: number;
  confirmations?: number;
  amount?: string;
  amountPositive?: boolean;
  assetName?: string;
  metadata?: Record<string, any>;
  source: 'blockchain' | 'audit' | 'system';
}

interface ActivityStats {
  total: number;
  today: number;
  onChain: number;
  investments: number;
  tokenMints: number;
  daoVotes: number;
  treasuryClaims: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ActivityCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  investment:     { label: 'Investment',      icon: <TrendingUp className="w-4 h-4" />,    color: 'text-indigo-400',  bg: 'bg-indigo-500/15',  border: 'border-indigo-500/40',  dot: 'bg-indigo-500' },
  token_mint:     { label: 'Token Mint',      icon: <Coins className="w-4 h-4" />,         color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   dot: 'bg-amber-500' },
  dao_vote:       { label: 'DAO Vote',        icon: <Vote className="w-4 h-4" />,          color: 'text-purple-400',  bg: 'bg-purple-500/15',  border: 'border-purple-500/40',  dot: 'bg-purple-500' },
  treasury_claim: { label: 'Treasury Claim',  icon: <Vault className="w-4 h-4" />,         color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', dot: 'bg-emerald-500' },
  marketplace:    { label: 'Marketplace',     icon: <ShoppingCart className="w-4 h-4" />,  color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/40',    dot: 'bg-cyan-500' },
  asset_approval: { label: 'Asset Approval',  icon: <ShieldCheck className="w-4 h-4" />,   color: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    dot: 'bg-blue-500' },
  kyc:            { label: 'KYC',             icon: <ShieldCheck className="w-4 h-4" />,   color: 'text-teal-400',    bg: 'bg-teal-500/15',    border: 'border-teal-500/40',    dot: 'bg-teal-500' },
  nominee:        { label: 'Nominee',         icon: <Users className="w-4 h-4" />,         color: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    dot: 'bg-rose-500' },
  system:         { label: 'System',          icon: <Cpu className="w-4 h-4" />,           color: 'text-slate-400',   bg: 'bg-slate-700/30',   border: 'border-slate-600/40',   dot: 'bg-slate-500' },
};

const STATUS_CONFIG: Record<ActivityStatus, { icon: React.ReactNode; label: string; color: string }> = {
  confirmed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Confirmed',  color: 'text-emerald-400' },
  pending:   { icon: <Clock className="w-3.5 h-3.5" />,        label: 'Pending',    color: 'text-amber-400' },
  failed:    { icon: <XCircle className="w-3.5 h-3.5" />,      label: 'Failed',     color: 'text-red-400' },
  info:      { icon: <Info className="w-3.5 h-3.5" />,         label: 'Info',       color: 'text-slate-400' },
};

const FILTERS: { label: string; value: ActivityCategory | 'all' }[] = [
  { label: 'All Activity',     value: 'all' },
  { label: 'Investments',      value: 'investment' },
  { label: 'Token Mints',      value: 'token_mint' },
  { label: 'DAO Votes',        value: 'dao_vote' },
  { label: 'Treasury Claims',  value: 'treasury_claim' },
  { label: 'Marketplace',      value: 'marketplace' },
  { label: 'Asset Approvals',  value: 'asset_approval' },
  { label: 'KYC',              value: 'kyc' },
  { label: 'Nominee',          value: 'nominee' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateGroup(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (eventDay.getTime() === today.getTime()) return 'Today';
  if (eventDay.getTime() === yesterday.getTime()) return 'Yesterday';
  if (today.getTime() - eventDay.getTime() < 7 * 86400000) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ event, onClose }: { event: ActivityEvent; onClose: () => void }) {
  const cfg = CATEGORY_CONFIG[event.category];
  const statusCfg = STATUS_CONFIG[event.status];
  const explorerUrl = event.txHash
    ? `https://amoy.polygonscan.com/tx/${event.txHash}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center ${cfg.color} flex-shrink-0`}>
              {cfg.icon}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{event.title}</div>
              <div className={`flex items-center gap-1 text-xs mt-0.5 ${statusCfg.color}`}>
                {statusCfg.icon}
                {statusCfg.label}
                <span className="text-slate-500 ml-1">·</span>
                <span className="text-slate-500">{relativeTime(event.timestamp)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex-shrink-0 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3">
              <div className="text-slate-500 mb-1">Category</div>
              <div className={`font-semibold ${cfg.color}`}>{cfg.label}</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <div className="text-slate-500 mb-1">Source</div>
              <div className="text-white font-semibold capitalize">{event.source}</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <div className="text-slate-500 mb-1">Timestamp</div>
              <div className="text-white font-mono">{new Date(event.timestamp).toLocaleString()}</div>
            </div>
            {event.amount && (
              <div className="bg-slate-800/60 rounded-xl p-3">
                <div className="text-slate-500 mb-1">Amount</div>
                <div className={`font-bold text-sm ${event.amountPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {event.amount}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3">
            <div className="text-slate-500 mb-1">Description</div>
            <div className="text-slate-200">{event.subtitle}</div>
          </div>

          {event.txHash && (
            <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Hash className="w-3.5 h-3.5" />
                Blockchain Transaction
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-indigo-300 font-mono text-[11px] bg-slate-900/60 px-2 py-1 rounded break-all">
                  {event.txHash}
                </code>
              </div>
              {event.blockNumber && (
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span>Block: <span className="text-white font-mono">#{event.blockNumber.toLocaleString()}</span></span>
                  {event.confirmations !== undefined && (
                    <span>Confirmations: <span className={event.confirmations >= 6 ? 'text-emerald-400' : 'text-amber-400'}>{event.confirmations}</span></span>
                  )}
                </div>
              )}
            </div>
          )}

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 select-none">
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                Raw Metadata
              </summary>
              <pre className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 rounded-xl p-3 overflow-auto max-h-40 font-mono">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Footer */}
        {explorerUrl && (
          <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              id={`explorer-link-${event.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-600/30 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on PolygonScan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ event, onViewDetails }: { event: ActivityEvent; onViewDetails: (e: ActivityEvent) => void }) {
  const cfg = CATEGORY_CONFIG[event.category];
  const statusCfg = STATUS_CONFIG[event.status];

  return (
    <div
      className="relative group flex gap-4 cursor-pointer"
      onClick={() => onViewDetails(event)}
      id={`activity-card-${event.id}`}
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.color} z-10 transition-transform group-hover:scale-110`}>
          {cfg.icon}
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 min-w-0 glass-card px-4 py-3 hover:border-slate-600/80 transition-all group-hover:bg-slate-800/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
              {event.title}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{event.subtitle}</div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Status badge */}
              <span className={`flex items-center gap-1 text-[10px] font-semibold ${statusCfg.color}`}>
                {statusCfg.icon}
                {statusCfg.label}
              </span>

              {/* Source badge */}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                event.source === 'blockchain'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
              }`}>
                {event.source === 'blockchain' ? '⛓ on-chain' : '📋 system'}
              </span>

              {/* TX Hash chip */}
              {event.txHash && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Hash className="w-3 h-3" />
                  {shortHash(event.txHash)}
                </span>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="text-right flex-shrink-0 space-y-1">
            {event.amount && (
              <div className={`text-sm font-bold ${event.amountPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {event.amount}
              </div>
            )}
            <div className="text-[10px] text-slate-600">{relativeTime(event.timestamp)}</div>
            <div className="text-[10px] text-slate-700">
              {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {/* View Details */}
            <div className="text-[10px] text-indigo-500 group-hover:text-indigo-300 transition-colors flex items-center gap-0.5 justify-end mt-1">
              Details <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityCenter() {
  const [activities, setActivities]   = useState<ActivityEvent[]>([]);
  const [stats, setStats]             = useState<ActivityStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [search, setSearch]           = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [activityRes, statsRes] = await Promise.all([
        api.get('/activity', {
          params: {
            category: categoryFilter === 'all' ? undefined : categoryFilter,
            search: search || undefined,
            limit: 200,
          },
        }),
        api.get('/activity/stats'),
      ]);

      setActivities(activityRes.data.data?.activities ?? []);
      setStats(statsRes.data.data ?? null);
    } catch (e: any) {
      setError('Could not load activity feed. Using demo data.');
      // Fallback demo data
      setActivities(DEMO_ACTIVITIES);
      setStats({
        total: DEMO_ACTIVITIES.length,
        today: 3,
        onChain: 4,
        investments: 2,
        tokenMints: 1,
        daoVotes: 2,
        treasuryClaims: 1,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Grouped activities ──────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const groups: Record<string, ActivityEvent[]> = {};
    const ORDER = ['Today', 'Yesterday'];

    activities.forEach((ev) => {
      const g = dateGroup(ev.timestamp);
      if (!groups[g]) groups[g] = [];
      groups[g].push(ev);
    });

    // Sort groups: Today → Yesterday → weekday names → dates
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return 0;
    });

    return sorted;
  }, [activities]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/10 border border-cyan-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Activity Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Every on-chain event, investment, vote, and system action — unified
            </p>
          </div>
        </div>
        <button
          id="activity-refresh"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Events"     value={stats.total}          color="text-white"        icon={<Activity className="w-4 h-4" />} />
          <StatCard label="Today"            value={stats.today}          color="text-cyan-400"     icon={<Clock className="w-4 h-4" />} />
          <StatCard label="On-Chain Events"  value={stats.onChain}        color="text-indigo-400"   icon={<Hash className="w-4 h-4" />} />
          <StatCard label="Investments"      value={stats.investments}    color="text-emerald-400"  icon={<TrendingUp className="w-4 h-4" />} />
        </div>
      )}

      {/* Mini stat row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <Coins className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-white font-bold text-sm">{stats.tokenMints}</div>
              <div className="text-[10px] text-slate-500">Token Mints</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <Vote className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div>
              <div className="text-white font-bold text-sm">{stats.daoVotes}</div>
              <div className="text-[10px] text-slate-500">DAO Votes</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <Vault className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-white font-bold text-sm">{stats.treasuryClaims}</div>
              <div className="text-[10px] text-slate-500">Treasury Claims</div>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="activity-search"
            type="text"
            placeholder="Search by title, hash, asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Filter toggle */}
        <button
          id="activity-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all ${
            categoryFilter !== 'all'
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {categoryFilter === 'all' ? 'Filter' : CATEGORY_CONFIG[categoryFilter as ActivityCategory]?.label}
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Filter Pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-fade-in">
          {FILTERS.map((f) => {
            const cfg = f.value !== 'all' ? CATEGORY_CONFIG[f.value as ActivityCategory] : null;
            const isActive = categoryFilter === f.value;
            return (
              <button
                key={f.value}
                id={`filter-${f.value}`}
                onClick={() => { setCategoryFilter(f.value as any); setShowFilters(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? `${cfg?.bg ?? 'bg-indigo-500/20'} ${cfg?.border ?? 'border-indigo-500/40'} ${cfg?.color ?? 'text-indigo-300'}`
                    : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {cfg?.icon}
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading activity feed...
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Activity className="w-10 h-10 mx-auto text-slate-700" />
          <p className="text-slate-500 text-sm">No activity found</p>
          {(search || categoryFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([group, events]) => (
            <div key={group}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                  group === 'Today'
                    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                    : group === 'Yesterday'
                    ? 'text-slate-300 bg-slate-700/30 border-slate-600/30'
                    : 'text-slate-500 bg-slate-800/30 border-slate-700/20'
                }`}>
                  {group}
                </span>
                <span className="text-[10px] text-slate-600">{events.length} events</span>
                <div className="h-px flex-1 bg-gradient-to-l from-slate-800 to-transparent" />
              </div>

              {/* Event list with connector line */}
              <div className="relative space-y-3">
                {/* Vertical timeline line */}
                <div className="absolute left-[18px] top-4 bottom-4 w-px bg-gradient-to-b from-slate-700/80 via-slate-800/60 to-transparent" />

                {events.map((ev) => (
                  <ActivityCard key={ev.id} event={ev} onViewDetails={setSelectedEvent} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {selectedEvent && (
        <DetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

// ─── Demo Fallback Data ───────────────────────────────────────────────────────

const DEMO_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'd1', category: 'investment', title: 'Token Purchase Confirmed',
    subtitle: 'Bought 40 MHCP tokens — Manhattan Commercial Plaza',
    status: 'confirmed', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    txHash: '0xc4d8e3b7a1f2908c4d8e3b7a1f2908c4d8e3b7a1f2908c4d8e3b7a1f2908c4d',
    blockNumber: 12345200, confirmations: 100,
    amount: '-$10,000', amountPositive: false,
    source: 'blockchain',
    metadata: { assetId: '1', buyer: '0xInvestor1', amount: '40', price: '250' },
  },
  {
    id: 'd2', category: 'token_mint', title: 'Asset Tokenized — Tokens Minted',
    subtitle: 'Total supply: 10,000 MHCP tokens deployed on Polygon Amoy',
    status: 'confirmed', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    blockNumber: 12345100, confirmations: 130,
    amount: '+10,000 tokens', amountPositive: true,
    source: 'blockchain',
    metadata: { assetId: '1', tokenAddress: '0xACT001', totalSupply: '10000' },
  },
  {
    id: 'd3', category: 'dao_vote', title: 'DAO Governance Proposal Created',
    subtitle: '"Add solar panel maintenance fund" — Proposal #1',
    status: 'info', timestamp: new Date(Date.now() - 86400000).toISOString(),
    txHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    blockNumber: 12345300, confirmations: 80,
    source: 'blockchain',
    metadata: { proposalId: '1', description: 'Add solar panel maintenance fund' },
  },
  {
    id: 'd4', category: 'asset_approval', title: 'Asset Approved for Tokenization',
    subtitle: 'Admin approved Manhattan Commercial Plaza for tokenization',
    status: 'info', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    source: 'audit',
    metadata: { assetId: 'asset-demo-uuid-001', actorRole: 'admin', severity: 'info' },
  },
  {
    id: 'd5', category: 'kyc', title: 'KYC Identity Verified',
    subtitle: 'KYC verification approved for Jane Smith (Asset Owner)',
    status: 'confirmed', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    source: 'audit',
    metadata: { userId: 'owner-demo-uuid-002', actorRole: 'admin', severity: 'info' },
  },
  {
    id: 'd6', category: 'marketplace', title: 'Token Purchase Confirmed',
    subtitle: 'Bought 500 tokens @ $100 from Marketplace',
    status: 'confirmed', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    txHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    blockNumber: 12345200, confirmations: 100,
    amount: '-$50,000', amountPositive: false,
    source: 'blockchain',
    metadata: { assetId: '1', buyer: '0xInvestor1', amount: '500', price: '100' },
  },
  {
    id: 'd7', category: 'system', title: '⚠️ Fraud Alert Detected',
    subtitle: 'AI flagged duplicate asset submission "Urban Residential Block"',
    status: 'failed', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    source: 'audit',
    metadata: { fraudScore: 72, duplicateOf: 'asset-demo-uuid-003', severity: 'warning' },
  },
];

// Backward-compatible alias for router import
export { ActivityCenter as ActivityTimeline };

