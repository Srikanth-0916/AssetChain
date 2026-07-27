import React, { useState } from 'react';
import { ShieldCheck, UserCheck, FileCheck, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export function AdminPanel() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Mock Admin State for Live Demo
  const [kycQueue, setKycQueue] = useState([
    { id: 'user-001', name: 'Robert Vance', role: 'Asset Owner', docCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' },
    { id: 'user-002', name: 'Elena Rostova', role: 'Investor', docCid: 'QmZtr9P871X11y83L9k1j3n3m737' },
  ]);

  const [pendingAssets, setPendingAssets] = useState([
    { id: 'asset-pending-01', title: 'Solar Array Delta', category: 'Renewable Energy', valuation: 850000, tokenSupply: 8500, owner: 'Robert Vance' },
  ]);

  const handleApproveKYC = (id: string, name: string) => {
    setKycQueue(kycQueue.filter((u) => u.id !== id));
    setActionMessage(`Approved KYC verification for ${name}.`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleApproveAsset = (id: string, title: string) => {
    setPendingAssets(pendingAssets.filter((a) => a.id !== id));
    setActionMessage(`Approved listing & triggered tokenization for ${title}! Contract deployed to Polygon Amoy.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Platform Administration</h1>
        <p className="text-xs text-slate-400">KYC verification queue, asset listing approvals, and smart contract tokenization controls</p>
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

      {/* Pending KYC Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Pending KYC Identity Verification</h3>
        {kycQueue.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">No pending KYC submissions in queue.</div>
        ) : (
          <div className="space-y-3 text-xs">
            {kycQueue.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 gap-3">
                <div>
                  <div className="font-semibold text-white">{u.name} ({u.role})</div>
                  <div className="text-slate-400 font-mono text-[11px]">IPFS Document CID: {u.docCid}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveKYC(u.id, u.name)}
                    className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-600/30 transition-all"
                  >
                    Approve KYC
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Asset Tokenization Table */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Pending Asset Listings & Tokenization Queue</h3>
        {pendingAssets.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">All asset registration requests have been processed.</div>
        ) : (
          <div className="space-y-3 text-xs">
            {pendingAssets.map((a) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 gap-3">
                <div>
                  <div className="font-semibold text-white">{a.title}</div>
                  <div className="text-slate-400 text-[11px]">Valuation: ${a.valuation.toLocaleString()} | Supply: {a.tokenSupply} tokens | Owner: {a.owner}</div>
                </div>
                <button
                  onClick={() => handleApproveAsset(a.id, a.title)}
                  className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-lg font-semibold hover:bg-indigo-600/30 transition-all"
                >
                  Approve & Deploy Contract
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
