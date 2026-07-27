import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Building2,
  ShieldAlert,
  Wallet,
  Coins,
  ArrowUpRight,
  Vote,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';
import { formatCurrency, truncateAddress } from '../lib/utils';

export function Dashboard() {
  const { user } = useAuth();
  const { isConnected, address, connect, switchToPolygonAmoy, isCorrectNetwork } = useWallet();

  const isInvestor = user?.role === 'investor';
  const isOwner = user?.role === 'asset_owner';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-8 glass-card border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono uppercase tracking-wider">
            {user?.role.replace('_', ' ')}
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            {isInvestor && 'Track your tokenized asset holdings, yields, and governance participation.'}
            {isOwner && 'Manage asset tokenization requests, funding progress, and document submissions.'}
            {isAdmin && 'Review platform compliance, KYC verification queue, and tokenization requests.'}
          </p>
        </div>

        {/* Action button */}
        <div className="z-10 flex flex-col sm:flex-row items-center gap-3">
          {isOwner && (
            <Link to="/assets/create" className="btn-primary text-xs">
              <PlusCircle className="w-4 h-4" /> Register New Asset
            </Link>
          )}
          {isInvestor && (
            <Link to="/marketplace" className="btn-primary text-xs">
              <Coins className="w-4 h-4" /> Browse Assets
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="btn-primary text-xs">
              <FileCheck2 className="w-4 h-4" /> Admin Controls
            </Link>
          )}
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Warnings & Alerts */}
      {user?.kyc_status !== 'approved' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold">KYC Verification Pending:</span> Complete identity verification to participate in primary token purchases and profit claims.
            </div>
          </div>
          <Link to="/profile" className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl font-medium hover:bg-amber-500/30 transition-all flex-shrink-0">
            Verify Identity
          </Link>
        </div>
      )}

      {!isConnected && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <span className="font-semibold">Wallet Disconnected:</span> Connect MetaMask to interact with on-chain smart contracts.
            </div>
          </div>
          <button onClick={() => connect()} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
            Connect MetaMask
          </button>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{isOwner ? 'Total Asset Valuation' : 'Portfolio Value'}</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            {formatCurrency(isOwner ? 1250000 : 15500)}
          </div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% yield return
          </div>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{isOwner ? 'Registered Assets' : 'Tokens Owned'}</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            {isOwner ? '3 Listings' : '450 Tokens'}
          </div>
          <div className="text-xs text-slate-400">Across 2 verified assets</div>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Governance Rights</span>
            <Vote className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            2 Proposals Active
          </div>
          <div className="text-xs text-purple-400 font-medium">1 Vote Pending</div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-base font-bold text-white">Recent Activity</h3>
            <span className="text-xs text-indigo-400">Live Sync</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="space-y-0.5">
                <div className="font-semibold text-white">KYC Status Check</div>
                <div className="text-slate-400">Verification state: {user?.kyc_status}</div>
              </div>
              <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 font-mono">System</span>
            </div>

            {isConnected && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">MetaMask Connected</div>
                  <div className="text-slate-400 font-mono">{truncateAddress(address)}</div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 font-mono">Web3</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Summary */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-base font-bold text-white">Account Details</h3>
            <Link to="/profile" className="text-xs text-indigo-400 hover:underline">Edit Profile</Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Legal Name</span>
              <span className="text-white font-medium">{user?.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email</span>
              <span className="text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Role</span>
              <span className="text-indigo-400 font-medium capitalize">{user?.role.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Wallet</span>
              <span className="text-slate-300 font-mono">{truncateAddress(user?.wallet_address || address)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
