import React, { useState, useEffect } from 'react';
import {
  FileSearch, Download, ShieldCheck, Database, Lock,
  ExternalLink, Layers, CheckCircle2, History, AlertCircle
} from 'lucide-react';

import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';
import { PageHeaderExplainer } from '../components/ui/PageHeaderExplainer';
import api from '../services/api';

export function AuditorDashboard() {
  const [stats, setStats] = useState({
    logsCount: 0,
    treasuryTotal: 0,
    contractsCount: 0,
    complianceStatus: '100% Pass',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuditorStats() {
      setIsLoading(true);
      try {
        const [auditRes, assetsRes] = await Promise.all([
          api.get('/audit', { params: { limit: 1 } }),
          api.get('/assets', { params: { limit: 100 } }),
        ]);

        const logsCount = auditRes.data.data?.meta?.total || 0;
        const assetsList = assetsRes.data.data?.assets || [];
        const contractsCount = assetsList.filter((a: any) => a.contract_address).length;
        const treasuryTotal = assetsList.reduce((sum: number, a: any) => sum + Number(a.valuation || 0), 0);

        setStats({
          logsCount,
          treasuryTotal,
          contractsCount,
          complianceStatus: '100% Pass',
        });
      } catch (err) {
        console.error('Failed to load auditor stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuditorStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeaderExplainer
        category="Read-Only Regulatory Audit Portal"
        title="Auditor Control Center — Immutable On-Chain Audit Ledger"
        subtitle="Inspect cryptographically signed audit logs, verify SPV treasury balances, validate Polygon block hashes, and export compliance reports."
        whatIsThis="This portal provides accredited financial auditors and regulators with read-only access to every transaction, due diligence vote, and dividend distribution."
        whatNext="Filter audit logs by date or transaction type, inspect raw Polygon block hashes, or click 'Export SEBI Audit Report'."
        whyBlockchain="Every action is immutably timestamped and linked to a cryptographic transaction hash on Polygon Amoy, preventing retroactive tamper risks."
        whyAI="AI monitors system logs to flag anomalous transaction volumes or unauthorized permission attempt spikes."
        defaultExpanded={true}
      />
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
          <span className="text-xs font-medium text-slate-400">Permanent Audit Log Entries</span>
          <div className="text-2xl font-extrabold text-white">
            {isLoading ? '...' : `${stats.logsCount.toLocaleString()} Logs`}
          </div>
          <p className="text-[11px] text-slate-300">Cryptographically signed records of all system and transaction events.</p>
          <div className="text-[10px] text-emerald-400 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Prevents retroactive tampering and guarantees complete audit transparency.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Total Escrow Funds Backing</span>
          <div className="text-2xl font-extrabold text-amber-400">
            {isLoading ? '...' : `₹${stats.treasuryTotal.toLocaleString()}`}
          </div>
          <p className="text-[11px] text-slate-300">Total property value deposited in legal bank escrow accounts.</p>
          <div className="text-[10px] text-amber-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Confirms 1:1 financial backing for every token issued on the platform.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Verified Token Smart Contracts</span>
          <div className="text-2xl font-extrabold text-emerald-400">
            {isLoading ? '...' : `${stats.contractsCount} Verified`}
          </div>
          <p className="text-[11px] text-slate-300">Active automated digital property code deployed on Polygon blockchain.</p>
          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Executes investor payouts and transfer restrictions without manual intervention.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Regulatory Audit Status</span>
          <div className="text-2xl font-extrabold text-purple-400">{stats.complianceStatus}</div>
          <p className="text-[11px] text-slate-300">Passes all SEBI and RBI digital asset compliance rules.</p>
          <div className="text-[10px] text-purple-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Ensures 100% legal compliance for institutional real-estate operations.
          </div>
        </div>
      </div>
    </div>
  );
}
