import React, { useState } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, CheckCircle2, XCircle,
  Search, Users, Filter, UserCheck, AlertTriangle, FileText
} from 'lucide-react';

import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';

export function ComplianceDashboard() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              Compliance Control Center
            </span>
            <span className="text-xs text-slate-400">• ERC-3643 Whitelist Gateway</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Compliance Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Review identity verifications, inspect 3D passive liveness scores, manage UN/OFAC sanctions checks, and update ERC-3643 token permission registries.
          </p>
        </div>
      </div>

      <RoleWorkQueueWidget role="compliance_officer" />

      {/* ── Metric Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Pending KYC Submissions</span>
          <div className="text-2xl font-extrabold text-amber-400">4 Submissions</div>
          <div className="text-xs text-amber-300">Awaiting Manual Verification</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">ERC-3643 Whitelisted Investors</span>
          <div className="text-2xl font-extrabold text-emerald-400">1,420 Active</div>
          <div className="text-xs text-emerald-400/80 font-medium">Verified On-Chain</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Sanctions Hits (OFAC/UN)</span>
          <div className="text-2xl font-extrabold text-emerald-400">0 Hits</div>
          <div className="text-xs text-slate-400">Continuous Screen Active</div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Average Verification Latency</span>
          <div className="text-2xl font-extrabold text-blue-400">1.2 Seconds</div>
          <div className="text-xs text-blue-300">HyperVerge AI Automated</div>
        </div>
      </div>

      {/* ── KYC Review Queue ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-400" /> Pending KYC & Identity Verification Queue
        </h2>

        <div className="glass-card p-0 border-slate-800 overflow-hidden divide-y divide-slate-800">
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">Dhayanithi Test Investor</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  98% LIVENESS SCORE
                </span>
              </div>
              <p className="text-xs text-slate-400">PAN: ABCDE1234F · Aadhaar Verified · Sanctions Clear</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>👤 Face Match: 96%</span>
                <span>🛡️ OFAC Screen: Passed</span>
                <span>🏛️ NSDL Tax Registry: Matched</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all">
                <CheckCircle2 className="w-4 h-4" /> Approve & Whitelist Wallet
              </button>
              <button className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition-all border border-red-500/30">
                <XCircle className="w-4 h-4" /> Reject KYC
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
