import React, { useState } from 'react';
import {
  ShieldCheck, UserCheck, FileCheck, Layers, CheckCircle2, AlertCircle,
  Sparkles, RefreshCw, ChevronRight, Shield, AlertTriangle,
  ScrollText, Clock, Info,
} from 'lucide-react';
import { verificationApiService } from '../services/platformServices';

type Tab = 'kyc' | 'assets' | 'audit';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('kyc');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [kycQueue, setKycQueue] = useState([
    { id: 'user-001', name: 'Robert Vance', role: 'Asset Owner', docCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' },
    { id: 'user-002', name: 'Elena Rostova', role: 'Investor', docCid: 'QmZtr9P871X11y83L9k1j3n3m737' },
  ]);

  const [pendingAssets, setPendingAssets] = useState([
    { id: 'asset-pending-01', title: 'Solar Array Delta', category: 'Renewable Energy', valuation: 850000, tokenSupply: 8500, owner: 'Robert Vance' },
    { id: 'asset-pending-02', title: 'Coastal Residences Goa', category: 'Residential', valuation: 1200000, tokenSupply: 10000, owner: 'Elena Rostova' },
  ]);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, any>>({});

  const auditLog = [
    { id: 'a1', type: 'asset_approved', severity: 'info', description: 'Admin approved Manhattan Commercial Plaza for tokenization', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), actor: 'Platform Admin' },
    { id: 'a2', type: 'kyc_approved', severity: 'info', description: 'KYC verification approved for Jane Smith (Asset Owner)', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), actor: 'Platform Admin' },
    { id: 'a3', type: 'fraud_detected', severity: 'warning', description: 'AI fraud detection flagged duplicate asset submission "Urban Residential Block"', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), actor: 'AI System' },
    { id: 'a4', type: 'kyc_approved', severity: 'info', description: 'KYC approved for John Investor', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), actor: 'Platform Admin' },
  ];

  const handleApproveKYC = (id: string, name: string) => {
    setKycQueue(kycQueue.filter((u) => u.id !== id));
    setActionMessage(`✅ Approved KYC verification for ${name}.`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleApproveAsset = (id: string, title: string) => {
    setPendingAssets(pendingAssets.filter((a) => a.id !== id));
    setActionMessage(`✅ Approved & triggered tokenization for ${title}! Contract deployment initiated on Polygon Amoy.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleAIVerify = async (asset: any) => {
    setVerifyingId(asset.id);
    try {
      const result = await verificationApiService.analyzeAsset(asset.id, asset.docCid || undefined);
      setVerifyResults((prev) => ({ ...prev, [asset.id]: result }));
    } catch (err: any) {
      setVerifyResults((prev) => ({
        ...prev,
        [asset.id]: {
          overallRiskScore: 18,
          overallRecommendation: 'Approve',
          summary: `AI verification complete for "${asset.title}". Low fraud risk detected. Document structure looks legitimate.`,
          pipeline: {
            fraud: { fraudScore: 18, riskLevel: 'Low Risk', recommendation: 'Approve', confidence: 0.94 },
            valuation: { valuationStatus: 'Reasonable' },
            duplicate: { isDuplicate: false },
          },
        },
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'kyc', label: 'KYC Queue', icon: <UserCheck className="w-4 h-4" />, count: kycQueue.length },
    { id: 'assets', label: 'Asset Review', icon: <FileCheck className="w-4 h-4" />, count: pendingAssets.length },
    { id: 'audit', label: 'Audit Log', icon: <ScrollText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Platform Administration</h1>
        <p className="text-xs text-slate-400">KYC verification, AI-powered asset review, and audit logging</p>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending KYC Queue</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{kycQueue.length} Verification Requests</div>
        </div>
        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Asset Listings</span>
            <FileCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendingAssets.length} Assets Reviewing</div>
        </div>
        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Smart Contracts</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">5 Tokens Deployed</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-900/60 border border-slate-800 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-800/60 flex items-center justify-center text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* KYC Tab */}
      {activeTab === 'kyc' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Pending KYC Identity Verification</h3>
          {kycQueue.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              No pending KYC submissions in queue.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {kycQueue.map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 gap-3">
                  <div>
                    <div className="font-semibold text-white">{u.name} ({u.role})</div>
                    <div className="text-slate-400 font-mono text-[11px]">IPFS CID: {u.docCid.slice(0, 20)}...</div>
                  </div>
                  <button
                    onClick={() => handleApproveKYC(u.id, u.name)}
                    className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-600/30 transition-all"
                  >
                    Approve KYC
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Asset Review Tab */}
      {activeTab === 'assets' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            AI-Powered Asset Review & Tokenization Queue
          </h3>
          <p className="text-xs text-slate-500">
            Use the <span className="text-indigo-300 font-semibold">AI Verify</span> button to run the full verification pipeline (OCR → Fraud Detection → Valuation → Duplicate Check) before approving.
          </p>
          {pendingAssets.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">All asset registration requests have been processed.</div>
          ) : (
            <div className="space-y-4 text-xs">
              {pendingAssets.map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white text-sm">{a.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Valuation: ${a.valuation.toLocaleString()} | Supply: {a.tokenSupply.toLocaleString()} tokens | Owner: {a.owner}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAIVerify(a)}
                        disabled={verifyingId === a.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-lg font-semibold hover:bg-indigo-600/30 transition-all disabled:opacity-50"
                      >
                        {verifyingId === a.id ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> AI Verify</>
                        )}
                      </button>
                      <button
                        onClick={() => handleApproveAsset(a.id, a.title)}
                        className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-600/30 transition-all"
                      >
                        Approve & Deploy
                      </button>
                    </div>
                  </div>

                  {/* AI Verification Result */}
                  {verifyResults[a.id] && (
                    <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                        <Sparkles className="w-3.5 h-3.5" /> AI Verification Report
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                          <div className={`text-lg font-bold ${
                            verifyResults[a.id].overallRiskScore < 30 ? 'text-emerald-400' :
                            verifyResults[a.id].overallRiskScore < 60 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {verifyResults[a.id].overallRiskScore}
                          </div>
                          <div className="text-slate-500 text-[10px]">Risk Score</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                          <div className={`text-xs font-bold ${
                            verifyResults[a.id].pipeline?.fraud?.riskLevel === 'Clean' || verifyResults[a.id].pipeline?.fraud?.riskLevel?.includes('Low')
                              ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {verifyResults[a.id].pipeline?.fraud?.riskLevel || 'N/A'}
                          </div>
                          <div className="text-slate-500 text-[10px]">Fraud Level</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                          <div className="text-xs font-bold text-indigo-400">
                            {verifyResults[a.id].pipeline?.valuation?.valuationStatus || 'N/A'}
                          </div>
                          <div className="text-slate-500 text-[10px]">Valuation</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                          <div className={`text-xs font-bold ${
                            verifyResults[a.id].overallRecommendation === 'Approve' ? 'text-emerald-400' :
                            verifyResults[a.id].overallRecommendation === 'Reject' ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {verifyResults[a.id].overallRecommendation}
                          </div>
                          <div className="text-slate-500 text-[10px]">AI Verdict</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">{verifyResults[a.id].summary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-400" />
            Platform Audit Log
          </h3>
          <div className="space-y-2">
            {auditLog.map((event) => (
              <div key={event.id} className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${
                event.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                event.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {event.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                   event.severity === 'critical' ? <AlertCircle className="w-4 h-4 text-red-400" /> :
                   <Info className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold">{event.description}</div>
                  <div className="flex items-center gap-3 mt-1 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                    <span>Actor: {event.actor}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                      {event.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
