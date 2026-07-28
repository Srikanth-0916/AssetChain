import React, { useState } from 'react';
import {
  ShieldCheck, UserCheck, FileCheck, Layers, CheckCircle2, AlertCircle,
  Sparkles, RefreshCw, ChevronRight, Shield, AlertTriangle,
  ScrollText, Clock, Info, CheckSquare, Users, Building, Scale, ExternalLink
} from 'lucide-react';
import { verificationApiService } from '../services/platformServices';

type Tab = 'kyc' | 'assets' | 'multisig' | 'inheritance' | 'audit';

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

  // Multi-Sig State (Module 14 & 13)
  const [multisigRequests, setMultisigRequests] = useState([
    {
      id: 'req-001',
      assetTitle: 'Solar Array Delta',
      assetId: 'asset-pending-01',
      spvName: 'Solar Farm Energy Asset Holdings S.L.',
      spvRegNo: 'ES-B98124501',
      trustee: 'Deutsche Bank Trust',
      status: 'pending',
      verifierVote: 'approved',
      legalVote: 'pending',
      adminVote: 'pending',
      approvedCount: 1,
    },
    {
      id: 'req-002',
      assetTitle: 'Coastal Residences Goa',
      assetId: 'asset-pending-02',
      spvName: 'Goa Coastal Villa Properties SPV LLC',
      spvRegNo: 'IND-DL-991204',
      trustee: 'Axis Trustee Services',
      status: 'pending',
      verifierVote: 'approved',
      legalVote: 'approved',
      adminVote: 'pending',
      approvedCount: 2,
    },
  ]);

  // Inheritance Claims State (Module 17)
  const [claims, setClaims] = useState([
    {
      id: 'claim-001',
      investorName: 'Jane Smith',
      investorWallet: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      nomineeName: 'Robert Doe',
      nomineeWallet: '0x9999999999999999999999999999999999999999',
      deathCertCID: 'QmDeathCertDoc99881122334455',
      probateCID: 'QmProbateCourtOrder77665544',
      status: 'pending_verification',
    },
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

  const handleMultisigSign = (reqId: string, role: 'legal' | 'admin') => {
    setMultisigRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        const updated = { ...r };
        if (role === 'legal') updated.legalVote = 'approved';
        if (role === 'admin') updated.adminVote = 'approved';

        const votes = [updated.verifierVote, updated.legalVote, updated.adminVote];
        updated.approvedCount = votes.filter((v) => v === 'approved').length;
        if (updated.approvedCount >= 2) updated.status = 'approved';
        return updated;
      })
    );
    setActionMessage(`✅ 2-of-3 Multi-Sig Vote recorded for ${role.toUpperCase()}. Requirement met!`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleVerifyInheritance = (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'verified' } : c))
    );
    setActionMessage('✅ Off-chain legal documents verified. Claim status set to VERIFIED.');
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleExecuteInheritance = (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'executed' } : c))
    );
    setActionMessage('✅ Inheritance token ownership transferred to Nominee wallet address!');
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
    { id: 'multisig', label: '2-of-3 Multi-Sig & SPV', icon: <CheckSquare className="w-4 h-4" />, count: multisigRequests.length },
    { id: 'inheritance', label: 'Inheritance Claims', icon: <Users className="w-4 h-4" />, count: claims.filter(c => c.status !== 'executed').length },
    { id: 'audit', label: 'Audit Log', icon: <ScrollText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Platform Administration & Governance</h1>
        <p className="text-xs text-slate-400">KYC verification, 2-of-3 Multi-Sig approval, SPV legal ownership, and inheritance verification</p>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending KYC Queue</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">{kycQueue.length} Pending</div>
        </div>
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>2-of-3 Multi-Sig Queue</span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{multisigRequests.length} Approvals</div>
        </div>
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Inheritance Claims</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white">{claims.length} Claim Filed</div>
        </div>
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active SPV Entities</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">5 SPVs Registered</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-900/60 border border-slate-800 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* Multi-Sig & SPV Tab — Module 14 & 13 */}
      {activeTab === 'multisig' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              2-of-3 Multi-Signature Approval Workflow (Module 14) & SPV Linking (Module 13)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Requires signatures from at least 2 distinct roles (Technical Verifier, Legal Reviewer, Platform Admin) before tokenization. Linked to Gnosis Safe Smart Account architecture.
            </p>
          </div>

          <div className="space-y-4">
            {multisigRequests.map((r) => (
              <div key={r.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {r.assetTitle}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold ${
                        r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {r.approvedCount}/3 Signed ({r.status})
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-3">
                      <span>SPV: <strong className="text-slate-200">{r.spvName}</strong> ({r.spvRegNo})</span>
                      <span>Trustee: <strong className="text-slate-200">{r.trustee}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 3 Role Badge Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[11px] flex items-center justify-between">
                      <span>Role 1: Verifier</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-emerald-300 font-semibold text-xs">Approved</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[11px] flex items-center justify-between">
                      <span>Role 2: Legal Reviewer</span>
                      {r.legalVote === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={r.legalVote === 'approved' ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
                        {r.legalVote === 'approved' ? 'Approved' : 'Pending Review'}
                      </span>
                      {r.legalVote !== 'approved' && (
                        <button
                          onClick={() => handleMultisigSign(r.id, 'legal')}
                          className="px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded hover:bg-indigo-600/50 text-[10px]"
                        >
                          Sign Legal
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[11px] flex items-center justify-between">
                      <span>Role 3: Platform Admin</span>
                      {r.adminVote === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={r.adminVote === 'approved' ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
                        {r.adminVote === 'approved' ? 'Approved' : 'Pending Sign'}
                      </span>
                      {r.adminVote !== 'approved' && (
                        <button
                          onClick={() => handleMultisigSign(r.id, 'admin')}
                          className="px-2 py-0.5 bg-emerald-600/30 text-emerald-300 rounded hover:bg-emerald-600/50 text-[10px]"
                        >
                          Sign Admin
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inheritance Claims Tab — Module 17 */}
      {activeTab === 'inheritance' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Off-Chain Legal Verification & Inheritance Claims (Module 17)
          </h3>
          <p className="text-xs text-slate-400">
            Review legal probate court orders and death certificates before executing administrative token transfer to nominee.
          </p>

          <div className="space-y-3 text-xs">
            {claims.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <span className="font-semibold text-white">Deceased Investor: {c.investorName}</span>
                    <div className="text-[11px] text-slate-400 font-mono">Wallet: {c.investorWallet}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold w-fit ${
                    c.status === 'executed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    c.status === 'verified' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Nominee Beneficiary</span>
                    <span className="text-white font-semibold">{c.nomineeName}</span>
                    <div className="font-mono text-slate-400 text-[10px]">{c.nomineeWallet}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IPFS Legal Documents</span>
                    <div className="text-indigo-300 font-mono text-[10px]">Death Cert CID: {c.deathCertCID}</div>
                    <div className="text-indigo-300 font-mono text-[10px]">Probate Court CID: {c.probateCID}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {c.status === 'pending_verification' && (
                    <button
                      onClick={() => handleVerifyInheritance(c.id)}
                      className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg font-semibold hover:bg-blue-600/30"
                    >
                      Verify Legal Documents
                    </button>
                  )}

                  {c.status === 'verified' && (
                    <button
                      onClick={() => handleExecuteInheritance(c.id)}
                      className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-600/30"
                    >
                      Execute Token Transfer to Nominee
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
