import { useState } from 'react';
import { Activity, TrendingUp, CheckCircle, Vote, Shield, Coins, Bell, ArrowUpRight, Filter } from 'lucide-react';

type EventType = 'investment' | 'income' | 'governance' | 'kyc' | 'trust' | 'token' | 'reward' | 'system';

interface TimelineEvent {
  id: number;
  type: EventType;
  title: string;
  subtitle: string;
  amount?: string;
  amountPositive?: boolean;
  timestamp: string;
  dateGroup: string;
  txHash?: string;
  asset?: string;
}

const EVENTS: TimelineEvent[] = [
  /* Today */
  { id: 1,  type: 'income',     title: 'Rental Income Received',         subtitle: 'From Green Valley Property Token',  amount: '+₹2,450',  amountPositive: true,  timestamp: '10:32 AM', dateGroup: 'Today',       txHash: '0xa3f9...d4c1', asset: 'Green Valley' },
  { id: 2,  type: 'reward',     title: 'Reward Points Earned',            subtitle: 'Monthly portfolio review bonus',    amount: '+100 pts', amountPositive: true,  timestamp: '08:15 AM', dateGroup: 'Today',       txHash: undefined, asset: undefined },
  /* Yesterday */
  { id: 3,  type: 'governance', title: 'DAO Vote Cast',                   subtitle: 'Proposal #47 — Fee Structure Update', amount: '+50 pts', amountPositive: true, timestamp: '06:45 PM', dateGroup: 'Yesterday',   txHash: '0xb17e...a9f2', asset: undefined },
  { id: 4,  type: 'investment', title: 'Investment Confirmed',            subtitle: 'TechHub Commercial Complex — ₹25,000', amount: '-₹25,000', amountPositive: false, timestamp: '02:10 PM', dateGroup: 'Yesterday',   txHash: '0xc4d8...e3b7', asset: 'TechHub' },
  { id: 5,  type: 'token',      title: 'Token Minted',                   subtitle: '25 TCHB tokens added to your wallet', amount: '25 TCHB', amountPositive: true, timestamp: '02:11 PM', dateGroup: 'Yesterday',   txHash: '0xc4d8...f1a9', asset: 'TechHub' },
  /* 2 days ago */
  { id: 6,  type: 'income',     title: 'Dividend Distribution',           subtitle: 'AgriTech Solar Farm — Q4 dividend',  amount: '+₹1,800', amountPositive: true,  timestamp: '11:00 AM', dateGroup: '2 days ago',  txHash: '0xd9e2...7c3f', asset: 'AgriTech' },
  { id: 7,  type: 'reward',     title: 'Referral Reward',                 subtitle: 'Friend Priya completed registration',   amount: '+300 pts', amountPositive: true, timestamp: '09:20 AM', dateGroup: '2 days ago',  txHash: undefined, asset: undefined },
  /* Earlier */
  { id: 8,  type: 'kyc',        title: 'KYC Verification Approved',       subtitle: 'Your identity has been verified',   amount: '+200 pts', amountPositive: true,  timestamp: '03:00 PM', dateGroup: '28 Nov 2024', txHash: undefined, asset: undefined },
  { id: 9,  type: 'trust',      title: 'Trust Score Updated',             subtitle: 'Score improved from 78 to 92',      amount: '+14 pts',  amountPositive: true,  timestamp: '03:01 PM', dateGroup: '28 Nov 2024', txHash: undefined, asset: undefined },
  { id: 10, type: 'investment', title: 'First Investment',                subtitle: 'Green Valley Property Token — ₹10,000', amount: '-₹10,000', amountPositive: false, timestamp: '11:45 AM', dateGroup: '01 Dec 2024', txHash: '0xf2a1...8d4e', asset: 'Green Valley' },
  { id: 11, type: 'token',      title: 'Token Minted',                   subtitle: '10 GVP tokens added to your wallet', amount: '10 GVP', amountPositive: true,  timestamp: '11:46 AM', dateGroup: '01 Dec 2024', txHash: '0xf2a1...9e5f', asset: 'Green Valley' },
  { id: 12, type: 'reward',     title: 'First Investment Reward',         subtitle: 'Welcome bonus for your first investment', amount: '+500 pts', amountPositive: true, timestamp: '11:47 AM', dateGroup: '01 Dec 2024', txHash: undefined, asset: undefined },
  { id: 13, type: 'system',     title: 'Account Created',                 subtitle: 'Welcome to AssetChain!',            amount: undefined, amountPositive: undefined, timestamp: '09:00 AM', dateGroup: '27 Nov 2024', txHash: undefined, asset: undefined },
];

const EVENT_CONFIG: Record<EventType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  investment: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40' },
  income:     { icon: <ArrowUpRight className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  governance: { icon: <Vote className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/40' },
  kyc:        { icon: <Shield className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  trust:      { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  token:      { icon: <Coins className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
  reward:     { icon: <span className="text-sm">⭐</span>, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
  system:     { icon: <Bell className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-700/30', border: 'border-slate-600/40' },
};

const TYPE_FILTERS: { label: string; value: EventType | 'all' }[] = [
  { label: 'All Events',   value: 'all' },
  { label: 'Investments',  value: 'investment' },
  { label: 'Income',       value: 'income' },
  { label: 'Governance',   value: 'governance' },
  { label: 'Rewards',      value: 'reward' },
  { label: 'Token Mints',  value: 'token' },
  { label: 'KYC & Trust',  value: 'kyc' },
];

export function ActivityTimeline() {
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [expanded, setExpanded]     = useState<number | null>(null);

  const filtered = typeFilter === 'all' ? EVENTS : EVENTS.filter(e => e.type === typeFilter);

  /* Group by dateGroup */
  const groups: Record<string, TimelineEvent[]> = {};
  filtered.forEach(e => {
    if (!groups[e.dateGroup]) groups[e.dateGroup] = [];
    groups[e.dateGroup].push(e);
  });

  return (
    <div className="page-container animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/10 border border-cyan-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activity Timeline</h1>
          <p className="text-sm text-slate-400">Every action, reward, and on-chain event — in one place</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Events',    value: EVENTS.length, color: 'text-white' },
          { label: 'Investments',     value: EVENTS.filter(e=>e.type==='investment').length, color: 'text-indigo-400' },
          { label: 'Income Events',   value: EVENTS.filter(e=>e.type==='income').length, color: 'text-emerald-400' },
          { label: 'Points Earned',   value: '1,200 pts', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="stat-card text-center py-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="overflow-x-auto mb-6">
        <div className="tab-bar inline-flex min-w-max">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value as EventType | 'all')}
              className={`tab-item ${typeFilter === f.value ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groups).map(([group, events]) => (
          <div key={group}>
            {/* Date group header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3">{group}</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Events */}
            <div className="relative pl-12 space-y-3">
              <div className="timeline-line" />
              {events.map(ev => {
                const cfg = EVENT_CONFIG[ev.type];
                const isExpanded = expanded === ev.id;
                return (
                  <div
                    key={ev.id}
                    className="relative animate-slide-up cursor-pointer group"
                    onClick={() => setExpanded(isExpanded ? null : ev.id)}
                  >
                    {/* Dot */}
                    <div className={`timeline-dot ${cfg.bg} ${cfg.border} ${cfg.color} absolute -left-12`}>
                      {cfg.icon}
                    </div>

                    {/* Card */}
                    <div className={`glass-card-hover px-4 py-3 ${isExpanded ? 'border-indigo-500/30' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">
                            {ev.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{ev.subtitle}</div>
                        </div>
                        <div className="text-right shrink-0">
                          {ev.amount && (
                            <div className={`text-sm font-bold ${ev.amountPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {ev.amount}
                            </div>
                          )}
                          <div className="text-xs text-slate-600">{ev.timestamp}</div>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && ev.txHash && (
                        <div className="mt-3 pt-3 border-t border-slate-800/60">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Tx Hash:</span>
                            <code className="text-indigo-400 font-mono bg-slate-900/50 px-2 py-0.5 rounded">{ev.txHash}</code>
                            <a
                              href={`https://amoy.polygonscan.com/tx/${ev.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 transition-colors ml-auto flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              View on Explorer <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                          {ev.asset && (
                            <div className="flex items-center gap-2 text-xs mt-1.5">
                              <span className="text-slate-500">Asset:</span>
                              <span className="text-white">{ev.asset}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No events of this type yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
