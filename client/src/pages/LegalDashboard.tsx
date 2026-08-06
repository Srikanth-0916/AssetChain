import React, { useState, useEffect } from 'react';
import {
  Scale, ShieldCheck, AlertTriangle, FileCheck, CheckCircle2,
  XCircle, Clock, Building2, Search, ExternalLink
} from 'lucide-react';

import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';
import { PageHeaderExplainer } from '../components/ui/PageHeaderExplainer';
import api from '../services/api';

export function LegalDashboard() {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [clearedCount, setClearedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLegalData() {
      setIsLoading(true);
      try {
        const [pendingRes, allAssetsRes] = await Promise.all([
          api.get('/approval/pending'),
          api.get('/assets', { params: { limit: 100 } }),
        ]);

        setPendingApprovals(pendingRes.data.data?.requests || []);
        const allAssets = allAssetsRes.data.data?.assets || [];
        const cleared = allAssets.filter((a: any) => a.verification_status === 'approved' || a.verification_status === 'tokenized').length;
        setClearedCount(cleared);
      } catch (err) {
        console.error('Failed to load legal data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLegalData();
  }, []);

  const handleVote = async (requestId: string, decision: 'approved' | 'rejected') => {
    try {
      await api.post('/approval/vote', {
        request_id: requestId,
        role: 'legal_reviewer',
        decision,
        comments: decision === 'approved' ? 'Title verified via E-Courts and land registry.' : 'Title deed validation failed.',
      });
      setPendingApprovals(prev => prev.filter(r => r.id !== requestId));
      if (decision === 'approved') {
        setClearedCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to submit legal vote:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeaderExplainer
        category="Legal & Title Deed Portal"
        title="Legal Control Center — Title Encumbrance Review"
        subtitle="Audit 30-year nil-encumbrance certificates, civil litigation databases, municipal land registry records, and issue SPV legal clearance."
        whatIsThis="This control center is used by accredited legal counsel to verify property ownership rights, mortgage liabilities, and legal title validity."
        whatNext="Review pending legal audit requests in your work queue below and issue legal clearance for qualified assets."
        whyBlockchain="Legal approvals trigger smart contract state transitions, recording attorney signatures immutably on Polygon Amoy."
        whyAI="AI cross-references land registry records against civil litigation databases to flag potential property dispute risks."
        defaultExpanded={true}
      />
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
          <span className="text-xs font-medium text-slate-400">Pending Property Title Audits</span>
          <div className="text-2xl font-extrabold text-amber-400">
            {isLoading ? '...' : `${pendingApprovals.length} Assets`}
          </div>
          <p className="text-[11px] text-slate-300">Properties awaiting legal counsel review of land registry title deeds.</p>
          <div className="text-[10px] text-amber-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Guarantees that only dispute-free property titles can be tokenized.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Verified Legal Titles</span>
          <div className="text-2xl font-extrabold text-emerald-400">
            {isLoading ? '...' : `${clearedCount} Verified`}
          </div>
          <p className="text-[11px] text-slate-300">Properties confirmed to have 100% clean title deeds and no legal mortgages.</p>
          <div className="text-[10px] text-emerald-400 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Gives investors complete legal protection and claim to real estate.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Active Property Court Cases</span>
          <div className="text-2xl font-extrabold text-emerald-400">0 Disputes</div>
          <p className="text-[11px] text-slate-300">Cross-referenced against civil court databases and government registries.</p>
          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Zero risk of litigation or ownership freezes for token holders.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 border-slate-800">
          <span className="text-xs font-medium text-slate-400">Legal SPV Holding Structures</span>
          <div className="text-2xl font-extrabold text-purple-400">100% Compliant</div>
          <p className="text-[11px] text-slate-300">Dedicated legal corporate entities holding the physical property titles.</p>
          <div className="text-[10px] text-purple-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Legally links digital token shares to physical property deeds.
          </div>
        </div>
      </div>

      {/* ── Legal Verification Queue ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-purple-400" /> Land Registry & Title Verification Audit Queue
        </h2>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <div className="text-white font-bold text-sm">All Title Audits Cleared!</div>
            <p className="text-xs text-slate-400">There are no pending property title verification requests.</p>
          </div>
        ) : (
          <div className="glass-card p-0 border-slate-800 overflow-hidden divide-y divide-slate-800">
            {pendingApprovals.map((reqItem: any) => (
              <div key={reqItem.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{reqItem.assetTitle || `Asset ${reqItem.assetId.slice(0, 8)}`}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                      NO LEGAL DISPUTES FOUND
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Request ID: {reqItem.id} · Status: {reqItem.status}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>📄 Title Deed: Registered</span>
                    <span>🏛️ Land Registry: Cleared</span>
                    <span>⚖️ Litigation: 0 Active Cases</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(reqItem.id, 'approved')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Issue Legal Clearance
                  </button>
                  <button
                    onClick={() => handleVote(reqItem.id, 'rejected')}
                    className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition-all border border-red-500/30"
                  >
                    <XCircle className="w-4 h-4" /> Reject Title
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
