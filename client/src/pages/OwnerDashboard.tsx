import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, PlusCircle, FileText, CheckCircle2, ShieldAlert,
  Coins, Layers, TrendingUp, ArrowUpRight, Clock, Sparkles, ChevronRight,
  ShieldCheck, Lock, Users, PieChart, Globe2, BarChart3, Receipt
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';
import { AssetActivityFeed } from '../components/workflow/AssetActivityFeed';

export function OwnerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_assets' | 'rental_deposits' | 'investor_analytics'>('my_assets');

  // Anonymous investor distribution following Institutional Privacy Standards
  const privacyShieldedInvestors = [
    { id: 'INV-8849-01', category: 'Institutional Investor', capitalDeployed: '$450,000', holdingsPct: '18.0%', jurisdiction: 'United States', status: 'KYC Cleared' },
    { id: 'INV-9021-02', category: 'Retail Accredited', capitalDeployed: '$250,000', holdingsPct: '10.0%', jurisdiction: 'United Kingdom', status: 'KYC Cleared' },
    { id: 'INV-4412-03', category: 'Institutional Family Office', capitalDeployed: '$800,000', holdingsPct: '32.0%', jurisdiction: 'Singapore', status: 'KYC Cleared' },
    { id: 'INV-1104-04', category: 'Retail Accredited', capitalDeployed: '$125,000', holdingsPct: '5.0%', jurisdiction: 'Germany', status: 'KYC Cleared' },
  ];

  return (
    <div className="page-container space-y-8 animate-fade-in pb-12">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Asset Owner Control Center
            </span>
            <span className="text-xs text-slate-400">• Institutional SPV Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Asset Owner Control Center — {user?.full_name || 'Asset Owner'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Tokenize real-world assets, monitor rental yields, track investor distribution with institutional privacy protection, and manage SPV compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/assets/create"
            className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-600/20"
          >
            <PlusCircle className="w-4 h-4" /> Onboard New Property
          </Link>
        </div>
      </div>

      {/* ── Issuer Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Asset Portfolio Valuation</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">$8,200,000</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 3 SPV Properties Active
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Capital Raised</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">$5,400,000</div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
            <span>65.8% Total Token Supply Sold</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Investor Privacy Shield</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">Anonymized</div>
          <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Compliant with SEC & GDPR
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rental Income Distributed</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">$428,500</div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <span>Polygon Amoy Auto-Disbursed</span>
          </div>
        </div>
      </div>

      {/* ── Main Workspace Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab('my_assets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab === 'my_assets' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
        >
          <Building2 className="w-4 h-4" /> My Asset Portfolio (3)
        </button>
        <button
          onClick={() => setActiveTab('investor_analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab === 'investor_analytics' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
        >
          <Lock className="w-4 h-4 text-purple-400" /> Investor Analytics (Privacy Protected)
        </button>
        <button
          onClick={() => setActiveTab('rental_deposits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
            ${activeTab === 'rental_deposits' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
        >
          <Receipt className="w-4 h-4" /> Rental Yield Disbursements
        </button>
      </div>

      {/* ── Tab 1: My Asset Portfolio ── */}
      {activeTab === 'my_assets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Manhattan Commercial Plaza', type: 'Commercial', valuation: '$2,500,000', raised: '$1,875,000', yieldPct: '8.2%', tokensLeft: '2,500 / 10,000', status: 'Active Trading' },
              { title: 'Solar Farm Grid Alpha 1', type: 'Renewable', valuation: '$1,200,000', raised: '$960,000', yieldPct: '9.5%', tokensLeft: '2,000 / 10,000', status: 'Active Trading' },
              { title: 'Luxury Villa Compound', type: 'Residential', valuation: '$4,500,000', raised: '$2,565,000', yieldPct: '7.8%', tokensLeft: '4,300 / 10,000', status: 'Active Trading' },
            ].map((asset, i) => (
              <div key={i} className="glass-card p-6 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="pill-badge pill-success text-[10px]">{asset.type}</span>
                  <span className="text-[11px] font-semibold text-emerald-400">{asset.status}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{asset.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Valuation: <strong className="text-white">{asset.valuation}</strong></p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capital Raised</span>
                    <span className="font-bold text-white">{asset.raised}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annualized Yield</span>
                    <span className="font-bold text-indigo-300">{asset.yieldPct} p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining Tokens</span>
                    <span className="font-mono text-slate-300">{asset.tokensLeft}</span>
                  </div>
                </div>
                <button className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-white transition-all">
                  Manage Asset Details & Deeds
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Investor Information Privacy Shield ── */}
      {activeTab === 'investor_analytics' && (
        <div className="space-y-6">
          {/* Privacy Notice Banner */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-3">
            <Lock className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <strong>Institutional Investor Privacy Enforcement:</strong> Individual investor PII (Name, Email, Phone, Wallet) is shielded according to institutional compliance regulations. Below is anonymized aggregate investor metrics.
            </div>
          </div>

          {/* Aggregate Distribution Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-white">$1,350,000</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Average Investment Size</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-emerald-400">64% / 36%</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Institutional vs Retail Split</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-indigo-400">12 Countries</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Geographical Diversity</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-amber-400">32.0%</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Largest Single Holder</div>
            </div>
          </div>

          {/* Anonymized Investor Table */}
          <div className="glass-card p-6 border border-white/[0.08] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Anonymized Investor Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">Anonymous ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Capital Deployed</th>
                    <th className="py-3 px-4">Holdings %</th>
                    <th className="py-3 px-4">Jurisdiction</th>
                    <th className="py-3 px-4">KYC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {privacyShieldedInvestors.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{inv.id}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{inv.category}</td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">{inv.capitalDeployed}</td>
                      <td className="py-3.5 px-4 text-slate-300">{inv.holdingsPct}</td>
                      <td className="py-3.5 px-4 text-slate-400">{inv.jurisdiction}</td>
                      <td className="py-3.5 px-4"><span className="pill-badge pill-success text-[9px]">{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Rental Yield Disbursements ── */}
      {activeTab === 'rental_deposits' && (
        <div className="glass-card p-6 border border-white/[0.08] space-y-4">
          <h3 className="text-base font-bold text-white">Rental Income Disbursement Ledger</h3>
          <p className="text-xs text-slate-400">Automated quarterly dividend distribution via Polygon Amoy smart contracts.</p>
          <div className="space-y-3">
            {[
              { period: 'Q2 2026 Dividend Disbursed', amount: '$107,125', date: '2026-06-30', txHash: '0x489d...fb10' },
              { period: 'Q1 2026 Dividend Disbursed', amount: '$107,125', date: '2026-03-31', txHash: '0x8f9d...1f90' },
            ].map((d, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{d.period}</div>
                  <div className="text-slate-400 font-mono text-[10px]">{d.txHash} • {d.date}</div>
                </div>
                <div className="text-right font-bold text-emerald-400">{d.amount}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Operational Work Queue & Activity Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <RoleWorkQueueWidget role="asset_owner" />
        <AssetActivityFeed />
      </div>
    </div>
  );
}
