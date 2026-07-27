import { ShieldCheck, UserCheck, FileCheck, Layers } from 'lucide-react';

export function AdminPanel() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Platform Administration</h1>
        <p className="text-xs text-slate-400">KYC verification, asset approval queue, and smart contract tokenization controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending KYC Queue</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">3 Verification Requests</div>
        </div>

        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Asset Listings</span>
            <FileCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">2 Assets Reviewing</div>
        </div>

        <div className="glass-card p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Smart Contracts</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">5 Tokens Deployed</div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Pending KYC Approvals</h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="font-semibold text-white">Jane Smith (Asset Owner)</div>
              <div className="text-slate-400 font-mono text-[11px]">CID: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-600/30">
                Approve
              </button>
              <button className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-300 rounded-lg font-semibold hover:bg-red-600/30">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
