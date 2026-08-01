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
  investor: [
    { id: 'wq-i1', title: 'DAO Governance Vote: Q3 Maintenance Fund Approval', category: 'Governance', priority: 'high', timeAgo: '2h ago', actionText: 'Cast DAO Vote' },
    { id: 'wq-i2', title: 'Q2 Rental Dividend Available for Claim ($1,250)', category: 'Dividends', priority: 'medium', timeAgo: '5h ago', actionText: 'Claim Payout' },
    { id: 'wq-i3', title: 'Annual Re-KYC Certification Due in 7 Days', category: 'Compliance', priority: 'high', timeAgo: '1d ago', actionText: 'Complete KYC' },
    { id: 'wq-i4', title: 'Watchlist Alert: Manhattan Plaza Yield Increased +0.4%', category: 'Watchlist', priority: 'low', timeAgo: '2d ago', actionText: 'View Asset' },
    { id: 'wq-i5', title: 'Q2 Investor Tax Statement Available for Download', category: 'Reports', priority: 'low', timeAgo: '3d ago', actionText: 'Download PDF' },
  ],
  asset_owner: [
    { id: 'wq-o1', title: 'Disburse Q3 Rental Dividends for Commercial Tower Alpha', category: 'Finance', priority: 'critical', timeAgo: '1h ago', actionText: 'Disburse Payout' },
    { id: 'wq-o2', title: 'Annual Fire Safety & Insurance Renewal Due', category: 'Maintenance', priority: 'high', timeAgo: '4h ago', actionText: 'Upload Policy' },
    { id: 'wq-o3', title: 'Upload Renewed Master Lease Agreement (Tenant Suite 402)', category: 'Leases', priority: 'medium', timeAgo: '1d ago', actionText: 'Upload Deed' },
    { id: 'wq-o4', title: 'Respond to 3 Investor Inquiries in Discussion Forum', category: 'Community', priority: 'low', timeAgo: '2d ago', actionText: 'Open Forum' },
  ],
  verifier: [
    { id: 'wq-v1', title: 'Commercial Plaza Deed Verification & OCR Scan Review', category: 'Deed Review', priority: 'critical', timeAgo: '30m ago', actionText: 'Inspect Deed' },
    { id: 'wq-v2', title: 'Knight Frank Appraisal Report Verification', category: 'Valuation', priority: 'high', timeAgo: '3h ago', actionText: 'Review Report' },
    { id: 'wq-v3', title: 'Multi-Sig Approval Vote: Solar Farm Grid Onboarding', category: 'Multi-Sig', priority: 'critical', timeAgo: '6h ago', actionText: 'Execute Vote' },
  ],
  legal_reviewer: [
    { id: 'wq-l1', title: '30-Year Nil-Encumbrance Certificate Search Audit', category: 'Title Audit', priority: 'critical', timeAgo: '1h ago', actionText: 'Audit Title' },
    { id: 'wq-l2', title: 'E-Courts Civil Litigation Clearance Review', category: 'Court Search', priority: 'high', timeAgo: '4h ago', actionText: 'Run Check' },
    { id: 'wq-l3', title: 'Issue SPV Legal Clearance Certificate', category: 'Clearance', priority: 'high', timeAgo: '1d ago', actionText: 'Issue Clearance' },
  ],
  compliance_officer: [
    { id: 'wq-c1', title: 'Flagged PEP AML Identity Screening Review', category: 'AML Alert', priority: 'critical', timeAgo: '15m ago', actionText: 'Inspect Screening' },
    { id: 'wq-c2', title: '3D Liveness Verification Review (Investor INV-8849)', category: 'KYC Verification', priority: 'high', timeAgo: '2h ago', actionText: 'Review Liveness' },
    { id: 'wq-c3', title: 'ERC-3643 Polygon Amoy Wallet Whitelist Approval', category: 'Whitelist', priority: 'high', timeAgo: '5h ago', actionText: 'Whitelist Wallet' },
  ],
  admin: [
    { id: 'wq-a1', title: '2-of-3 Multi-Sig Execution Required: Treasury Withdrawal', category: 'Multi-Sig', priority: 'critical', timeAgo: '10m ago', actionText: 'Sign On-Chain' },
    { id: 'wq-a2', title: 'Polygon Amoy Node Latency Warning (210ms)', category: 'System Health', priority: 'medium', timeAgo: '1h ago', actionText: 'Inspect Node' },
    { id: 'wq-a3', title: 'Review Failed Payment Webhook Retry Queue', category: 'Payments', priority: 'high', timeAgo: '3h ago', actionText: 'Retry Webhook' },
  ],
  auditor: [
    { id: 'wq-au1', title: 'Verify Q2 Treasury Vault Snapshot Ledger Integrity', category: 'Audit Log', priority: 'high', timeAgo: '2h ago', actionText: 'Verify Snapshot' },
    { id: 'wq-au2', title: 'Export Annual Regulatory Compliance Audit Log', category: 'Reports', priority: 'medium', timeAgo: '1d ago', actionText: 'Export Audit Log' },
  ],
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
