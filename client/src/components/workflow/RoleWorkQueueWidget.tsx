import React, { useState } from 'react';
import {
  CheckSquare, AlertCircle, Clock, CheckCircle2, ArrowRight,
  ShieldCheck, FileCheck, Users, Scale, FileText, Vote, DollarSign
} from 'lucide-react';

export interface WorkQueueItem {
  id: string;
  title: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeAgo: string;
  actionText: string;
  route?: string;
}

interface RoleWorkQueueWidgetProps {
  role: string;
  onAction?: (item: WorkQueueItem) => void;
}

const ROLE_QUEUES: Record<string, WorkQueueItem[]> = {
  investor: [],
  asset_owner: [],
  verifier: [],
  legal_reviewer: [],
  compliance_officer: [],
  admin: [],
  auditor: [],
};

export function RoleWorkQueueWidget({ role, onAction }: RoleWorkQueueWidgetProps) {
  const queue = ROLE_QUEUES[role] || ROLE_QUEUES['investor'];
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  const handleTaskComplete = (item: WorkQueueItem) => {
    setCompletedItems(prev => [...prev, item.id]);
    if (onAction) onAction(item);
  };

  const activeQueue = queue.filter(item => !completedItems.includes(item.id));

  return (
    <div className="glass-card p-6 border border-indigo-500/20 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="pill-badge pill-success text-[10px]">Role Action Queue</span>
            <span className="text-xs text-slate-400 font-mono">Live Institutional Workflows</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Today's Pending Work Queue</h3>
          <p className="text-xs text-slate-400">Workflow tasks requiring review, verification, or action.</p>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-indigo-400">{activeQueue.length} Tasks Pending</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold">{completedItems.length} Completed Today</div>
        </div>
      </div>

      {activeQueue.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
          <div className="text-white font-bold text-sm">All Work Queue Tasks Cleared!</div>
          <p className="text-xs text-slate-400">You are up to date on all institutional workflow actions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeQueue.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.08] hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5
                  ${item.priority === 'critical' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
                    item.priority === 'high' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
                    'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'}`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      item.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                      item.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Category: <span className="text-slate-300 font-semibold">{item.category}</span> • <span className="font-mono text-slate-500">{item.timeAgo}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTaskComplete(item)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 self-end md:self-auto shadow-md"
              >
                {item.actionText} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
