import React, { useState } from 'react';
import {
  Scale, ShieldCheck, AlertTriangle, FileCheck, CheckCircle2,
  XCircle, Clock, Building2, Search, ExternalLink
} from 'lucide-react';

import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';

export function LegalDashboard() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>('ast-com-01');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              Legal Control Center
            </span>
            <span className="text-xs text-slate-400">• E-Courts & Land Registry Interface</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Legal Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Audit property title deeds, 30-year nil-encumbrance certificates, civil court litigation records, and issue SPV legal clearance.
          </p>
        </div>
      </div>

      <RoleWorkQueueWidget role="legal_reviewer" />

      {/* ── Metric Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Pending Legal Audits</span>
          <div className="text-2xl font-extrabold text-amber-400">2 Assets</div>
          <div className="text-xs text-slate-400">Awaiting Title Verification</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Cleared Property Titles</span>
          <div className="text-2xl font-extrabold text-emerald-400">12 Verified</div>
          <div className="text-xs text-emerald-400/80 font-medium">Nil Encumbrance Confirmed</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Active Litigation Alerts</span>
          <div className="text-2xl font-extrabold text-red-400">0 Disputes</div>
          <div className="text-xs text-slate-400">E-Courts Database Checked</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">SPV Legal Structures</span>
          <div className="text-2xl font-extrabold text-purple-400">100% Compliant</div>
          <div className="text-xs text-purple-300">Section 8 / Private Ltd Wrappers</div>
        </div>
      </div>

      {/* ── Legal Verification Queue ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-purple-400" /> Land Registry & Title Verification Audit Queue
        </h2>

        <div className="glass-card p-0 border-slate-800 overflow-hidden divide-y divide-slate-800">
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">BKC Prime Commercial Tower</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  NIL ENCUMBRANCE CONFIRMED
                </span>
              </div>
              <p className="text-xs text-slate-400">Survey No. SUR-8849-B · SRO Bandra, Mumbai · Valuation ₹25 Cr</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>📄 Title Deed: Registered 2018</span>
                <span>🏛️ Land Registry: Cleared</span>
                <span>⚖️ Litigation: 0 Active Cases</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all">
                <CheckCircle2 className="w-4 h-4" /> Issue Legal Clearance
              </button>
              <button className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition-all border border-red-500/30">
                <XCircle className="w-4 h-4" /> Reject Title
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
