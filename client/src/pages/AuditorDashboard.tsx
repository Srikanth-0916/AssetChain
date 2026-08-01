import React from 'react';
import {
  FileSearch, Download, ShieldCheck, Database, Lock,
  ExternalLink, Layers, CheckCircle2, History, AlertCircle
} from 'lucide-react';

import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';

export function AuditorDashboard() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Auditor Control Center
            </span>
            <span className="text-xs text-slate-400">• RSA-4096 Signed Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Auditor Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Read-only immutable transaction inspection, Treasury Vault snapshot verification, and SEBI/RBI compliance report downloads.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all">
          <Download className="w-4 h-4 text-emerald-400" /> Export SEBI Audit Report (PDF/JSON)
        </button>
      </div>

      <RoleWorkQueueWidget role="auditor" />

      {/* ── Audit Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Immutable Audit Entries</span>
          <div className="text-2xl font-extrabold text-white">4,812 Logs</div>
          <div className="text-xs text-emerald-400">Append-Only Cryptographic Record</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Treasury Snapshot Total</span>
          <div className="text-2xl font-extrabold text-amber-400">₹45,00,00,000</div>
          <div className="text-xs text-amber-300">100% Backed by Escrow NAV</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">On-Chain Smart Contracts</span>
          <div className="text-2xl font-extrabold text-emerald-400">6 Verified</div>
          <div className="text-xs text-slate-400">Polygon Amoy Testnet (80002)</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Regulatory Compliance</span>
          <div className="text-2xl font-extrabold text-purple-400">100% Pass</div>
          <div className="text-xs text-purple-300">Digital RSA Signature Verified</div>
        </div>
      </div>
    </div>
  );
}
