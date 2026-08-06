import React from 'react';
import { ShieldCheck, FileCheck, DollarSign, MessageSquare, UserCheck, Vote, Clock, CheckCircle2 } from 'lucide-react';

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  type: 'legal' | 'verification' | 'funding' | 'dividend' | 'discussion' | 'investor' | 'governance';
  actor: string;
  title: string;
  description: string;
  txHash?: string;
}

const DEFAULT_ACTIVITIES: ActivityFeedItem[] = [
  {
    id: 'act-001',
    timestamp: '10 mins ago',
    type: 'investor',
    actor: 'Accredited Investor (Rahul M.)',
    title: 'New Investment Received',
    description: 'Rahul invested ₹4,15,000 to purchase fractional property shares. Status: Completed.',
    txHash: '0x8f9d...1f90',
  },
  {
    id: 'act-002',
    timestamp: '2 hours ago',
    type: 'dividend',
    actor: 'Property Management Escrow',
    title: 'Rental Income Distributed',
    description: 'Investors received this month\'s rental income payout. Total amount distributed: ₹10,33,350.',
    txHash: '0x489d...fb10',
  },
  {
    id: 'act-003',
    timestamp: '5 hours ago',
    type: 'legal',
    actor: 'Independent Legal Counsel',
    title: 'Property Verification Completed',
    description: 'Government ownership documents and title deeds verified successfully with no legal disputes found.',
  },
  {
    id: 'act-004',
    timestamp: 'Yesterday',
    type: 'verification',
    actor: 'Independent Valuer',
    title: 'Property Tokenized',
    description: 'Digital ownership shares created and verified. Property is now live for fractional investment.',
  },
  {
    id: 'act-005',
    timestamp: '2 days ago',
    type: 'governance',
    actor: 'Property Community',
    title: 'Community Voting Started',
    description: 'Token holders can now vote on allocating funds for building maintenance.',
  },
];

export function AssetActivityFeed({ activities = DEFAULT_ACTIVITIES }: { activities?: ActivityFeedItem[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'legal': return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'verification': return <FileCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'funding': return <DollarSign className="w-3.5 h-3.5 text-indigo-400" />;
      case 'dividend': return <DollarSign className="w-3.5 h-3.5 text-amber-400" />;
      case 'discussion': return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
      case 'investor': return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'governance': return <Vote className="w-3.5 h-3.5 text-pink-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <span className="pill-badge pill-success text-[10px]">Real-Time Event Stream</span>
          <h3 className="text-xl font-bold text-white mt-1">Asset Audit & Activity Feed</h3>
          <p className="text-xs text-slate-400">Live chronological audit log of legal approvals, investments, and distributions.</p>
        </div>
        <div className="text-xs text-slate-400 font-mono">Live WebSocket Sync</div>
      </div>

      <div className="space-y-4">
        {activities.map((item) => (
          <div key={item.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 text-xs group">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
              {getIcon(item.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{item.title}</h4>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-white/[0.04]">
                <span>Actor: <strong className="text-slate-300">{item.actor}</strong></span>
                {item.txHash && <span className="font-mono text-purple-400">Tx: {item.txHash}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
