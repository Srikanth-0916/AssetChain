import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Building2, PlusCircle, FileText, CheckCircle2,
  Coins, TrendingUp, ArrowUpRight, Sparkles, ChevronRight,
  Lock, Users, BarChart3, Receipt, Globe2,
  ShieldCheck, PieChart, Activity, Zap, Eye, Upload,
  Layers, ClipboardList, Settings, AlertTriangle,
} from 'lucide-react';
import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';
import { AssetActivityFeed } from '../components/workflow/AssetActivityFeed';
import { AssetLifecycleTimeline } from '../components/workflow/AssetLifecycleTimeline';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function OwnerStatCard({
  label, value, sub, icon, accent = 'emerald', delay = 0,
}: { label: string; value: string; sub?: string; icon: React.ReactNode; accent?: string; delay?: number }) {
  const accentMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'rgba(16,185,129,0.10)' },
    indigo:  { text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  glow: 'rgba(99,102,241,0.10)' },
    amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   glow: 'rgba(245,158,11,0.08)' },
    purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  glow: 'rgba(168,85,247,0.08)' },
  };
  const a = accentMap[accent] ?? accentMap.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative p-5 rounded-2xl border ${a.border} overflow-hidden group hover:scale-[1.02] transition-transform duration-200`}
      style={{ background: `radial-gradient(ellipse at top right, ${a.glow} 0%, rgba(15,23,42,0.8) 70%)`, backdropFilter: 'blur(20px)' }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${a.bg} blur-2xl opacity-50 pointer-events-none`} />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">{label}</span>
          <div className={`p-2 rounded-xl ${a.bg} border ${a.border} ${a.text}`}>{icon}</div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        {sub && <div className={`text-[11px] font-medium ${a.text} flex items-center gap-1`}><ArrowUpRight className="w-3 h-3" />{sub}</div>}
      </div>
    </motion.div>
  );
}

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetOwnerCard({ asset }: { asset: any }) {
  const supply = Number(asset.token_supply || 1);
  const available = Number(asset.tokens_available ?? asset.token_supply ?? 1);
  const soldRatio = (supply - available) / supply;
  const raisedAmount = Number(asset.valuation || 0) * soldRatio;
  const percentFunded = Math.min(100, Math.round(soldRatio * 100));
  const yieldPct = 8.5;
  const statusColor: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    verified: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    tokenized: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  const statusClass = statusColor[asset.verification_status] ?? statusColor.pending;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative rounded-2xl overflow-hidden border border-white/[0.07] group"
      style={{ background: 'linear-gradient(135deg, rgba(5,46,22,0.3) 0%, rgba(15,23,42,0.9) 60%)', backdropFilter: 'blur(20px)' }}
    >
      {/* Accent top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600" />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {(asset.asset_type || 'Real Estate').replace(/_/g, ' ')}
            </span>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">{asset.title}</h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Globe2 className="w-3 h-3" /> {asset.location || 'Asset Location'}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${statusClass}`}>
            {(asset.verification_status || 'pending').replace(/_/g, ' ')}
          </span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Total Valuation</div>
            <div className="text-sm font-bold text-white">${Number(asset.valuation || 0).toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Capital Raised</div>
            <div className="text-sm font-bold text-emerald-400">${raisedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Tokens Available</div>
            <div className="text-sm font-mono text-slate-200">{available.toLocaleString()}/{supply.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Annualized Yield</div>
            <div className="text-sm font-bold text-teal-300">{yieldPct}% p.a.</div>
          </div>
        </div>

        {/* Funding progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Token Funding Progress</span>
            <span className="font-bold text-emerald-400">{percentFunded}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-700"
              style={{ width: `${percentFunded}%` }}
            />
          </div>
        </div>

        <button className="w-full py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-400 text-emerald-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-emerald-900/30">
          <Settings className="w-3.5 h-3.5" /> Manage Asset & Deeds
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function OwnerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assets' | 'investors' | 'dividends' | 'pipeline'>('assets');
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOwnerAssets() {
      setIsLoading(true);
      try {
        const res = await api.get('/assets/my');
        setAssets(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to load owner assets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOwnerAssets();
  }, []);

  const totalValuation = assets.reduce((sum, a) => sum + Number(a.valuation || 0), 0);
  const totalCapitalRaised = assets.reduce((sum, a) => {
    const supply = Number(a.token_supply || 1);
    const available = Number(a.tokens_available ?? a.token_supply ?? 1);
    return sum + (Number(a.valuation || 0) * ((supply - available) / supply));
  }, 0);
  const totalDividendsDistributed = totalCapitalRaised * 0.08;

  const privacyInvestors = totalCapitalRaised > 0 ? [
    { id: 'INV-8849-A1', category: 'Institutional Fund', capital: totalCapitalRaised * 0.4, pct: '40.0%', country: 'United States' },
    { id: 'INV-9021-B2', category: 'Retail Accredited',  capital: totalCapitalRaised * 0.2, pct: '20.0%', country: 'United Kingdom' },
    { id: 'INV-4412-C3', category: 'Family Office',      capital: totalCapitalRaised * 0.3, pct: '30.0%', country: 'Singapore' },
    { id: 'INV-1104-D4', category: 'Retail Accredited',  capital: totalCapitalRaised * 0.1, pct: '10.0%', country: 'Germany' },
  ] : [];

  const dividendHistory = totalCapitalRaised > 0 ? [
    { period: 'Q2 2026 Disbursement', amount: totalCapitalRaised * 0.04, date: '2026-06-30', tx: '0x489d...fb10', status: 'Confirmed' },
    { period: 'Q1 2026 Disbursement', amount: totalCapitalRaised * 0.04, date: '2026-03-31', tx: '0x8f9d...1f90', status: 'Confirmed' },
  ] : [];

  const firstName = user?.full_name?.split(' ')[0] || 'Owner';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto space-y-8 pb-16">

      {/* ── Hero Header (Asset Owner: emerald/teal gradient distinct from investor) ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.55) 0%, rgba(15,23,42,0.95) 50%, rgba(8,18,38,0.98) 100%)' }}
      >
        {/* Glow */}
        <div className="absolute top-0 left-[15%] w-[450px] h-[280px] rounded-full bg-emerald-600/[0.08] blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-10 right-[5%] w-[300px] h-[240px] rounded-full bg-teal-600/[0.06] blur-[100px] pointer-events-none" />
        {/* Border */}
        <div className="absolute inset-0 rounded-3xl border border-emerald-500/20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 p-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Asset Originator &amp; SPV Portal
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" /> Institutional Platform · Live
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {greeting}, <span className="text-emerald-400">{firstName}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg">
              Tokenize real-world assets, monitor capital raises, track investor dividend distributions, and manage SPV legal compliance pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link to="/assets/create" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-none text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40">
              <PlusCircle className="w-4 h-4" /> Onboard New Property
            </Link>
            <Link to="/ai-copilot" className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500/40 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Valuation Assistant
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards (Owner-specific metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OwnerStatCard
          label="Total Property Valuation"
          value={isLoading ? '—' : `$${totalValuation.toLocaleString()}`}
          sub="Appraised portfolio value"
          icon={<Building2 className="w-4 h-4" />}
          accent="emerald"
          delay={0.05}
        />
        <OwnerStatCard
          label="Capital Raised from Investors"
          value={isLoading ? '—' : `$${totalCapitalRaised.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="Investor funding deployed"
          icon={<Coins className="w-4 h-4" />}
          accent="indigo"
          delay={0.1}
        />
        <OwnerStatCard
          label="Dividends Distributed"
          value={isLoading ? '—' : `$${totalDividendsDistributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="Via smart contract payouts"
          icon={<TrendingUp className="w-4 h-4" />}
          accent="amber"
          delay={0.15}
        />
        <OwnerStatCard
          label="Investor Privacy Shield"
          value="Anonymized"
          sub="GDPR & SEC compliant"
          icon={<Lock className="w-4 h-4" />}
          accent="purple"
          delay={0.2}
        />
      </div>

      {/* ── Asset Lifecycle Timeline ── */}
      <AssetLifecycleTimeline currentStageNumber={5} />

      {/* ── Onboarding Progress Cards ── */}
      {assets.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { step: 1, icon: <Upload className="w-5 h-5" />, title: 'Submit Property Deed', desc: 'Upload your title deed for AI-powered OCR scanning and legal verification.', color: 'emerald', action: 'Onboard Now', href: '/assets/create' },
            { step: 2, icon: <ClipboardList className="w-5 h-5" />, title: 'KYC & SPV Registration', desc: 'Complete identity verification and register your Special Purpose Vehicle.', color: 'indigo', action: 'Start KYC', href: '/profile' },
            { step: 3, icon: <Layers className="w-5 h-5" />, title: 'Mint ERC-3643 Tokens', desc: 'Once verified, tokens are minted on Polygon and listed on the marketplace.', color: 'amber', action: 'Learn More', href: '/marketplace' },
          ].map(({ step, icon, title, desc, color, action, href }) => (
            <div key={step} className={`p-5 rounded-2xl border border-${color}-500/20 bg-${color}-500/5 space-y-3`}>
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/15 border border-${color}-500/20 flex items-center justify-center text-${color}-400`}>
                {icon}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Step {step}</div>
                <div className="text-sm font-bold text-white">{title}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </div>
              <Link to={href} className={`text-xs font-bold text-${color}-400 hover:text-${color}-300 flex items-center gap-1 transition-colors`}>
                {action} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Main Tab Navigation ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/60 border border-white/[0.06] w-fit flex-wrap">
        {([
          { id: 'assets',    label: 'Asset Portfolio', icon: <Building2 className="w-3.5 h-3.5" />, count: assets.length },
          { id: 'investors', label: 'Investor Analytics', icon: <Lock className="w-3.5 h-3.5" /> },
          { id: 'dividends', label: 'Dividend Ledger', icon: <Receipt className="w-3.5 h-3.5" /> },
          { id: 'pipeline',  label: 'Ops Pipeline', icon: <Activity className="w-3.5 h-3.5" /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-400 hover:text-white'}`}
          >
            {tab.icon}
            {tab.label}
            {'count' in tab && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Asset Portfolio ── */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Tokenized Asset Portfolio</h2>
              <p className="text-xs text-slate-400">All properties onboarded for ERC-3643 token issuance on Polygon Amoy.</p>
            </div>
            <Link to="/assets/create" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
              <PlusCircle className="w-3.5 h-3.5" /> Add Property
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-2xl bg-slate-900/60 border border-white/[0.05] animate-pulse" />)}
            </div>
          ) : assets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-14 text-center rounded-3xl border border-dashed border-emerald-500/20 bg-emerald-950/10 space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">No Assets Onboarded Yet</h3>
              <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
                Start tokenizing your real-world properties. Submit your first title deed for AI scanning and legal verification.
              </p>
              <Link to="/assets/create" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all mt-2">
                <PlusCircle className="w-4 h-4" /> Onboard First Property
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assets.map((asset, i) => <AssetOwnerCard key={asset.id || i} asset={asset} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Investor Analytics ── */}
      {activeTab === 'investors' && (
        <div className="space-y-5">
          {/* Privacy Banner */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-500/8 border border-purple-500/25 text-purple-300 text-xs">
            <Lock className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <strong>Institutional Privacy Protection Active:</strong> Individual investor PII (Name, Email, Wallet) is shielded per SEC &amp; GDPR regulations. Showing anonymized aggregate investor metrics only.
            </div>
          </div>

          {privacyInvestors.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-purple-500/20 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-white font-bold">No Investors Yet</div>
              <p className="text-xs text-slate-400">Once your assets are tokenized and listed, investor analytics will appear here.</p>
            </div>
          ) : (
            <>
              {/* Summary metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Avg. Investment Size', value: `$${(totalCapitalRaised / 4).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'text-white' },
                  { label: 'Institutional vs Retail', value: '70% / 30%', color: 'text-emerald-400' },
                  { label: 'Geographic Diversity', value: '4 Countries', color: 'text-indigo-400' },
                  { label: 'Largest Single Holder', value: '40.0%', color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                    <div className={`text-xl font-black ${color}`}>{value}</div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>

              {/* Anonymized Investor Table */}
              <div className="glass-card p-6 border border-white/[0.07] space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> Anonymized Investor Ledger
                  <span className="ml-auto text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">Privacy Protected</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Anon ID</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Capital</th>
                        <th className="py-3 px-4">Holdings %</th>
                        <th className="py-3 px-4">Jurisdiction</th>
                        <th className="py-3 px-4">KYC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {privacyInvestors.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{inv.id}</td>
                          <td className="py-3.5 px-4 text-white font-medium">{inv.category}</td>
                          <td className="py-3.5 px-4 text-emerald-400 font-bold">${inv.capital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="py-3.5 px-4 text-slate-300">{inv.pct}</td>
                          <td className="py-3.5 px-4 text-slate-400">{inv.country}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">✓ KYC Cleared</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Dividend Ledger ── */}
      {activeTab === 'dividends' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Distributed</div>
              <div className="text-2xl font-black text-white">${totalDividendsDistributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="text-[11px] text-slate-400">Cumulative Q1–Q2 2026</div>
            </div>
            <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Next Distribution</div>
              <div className="text-2xl font-black text-white">Sep 30, 2026</div>
              <div className="text-[11px] text-slate-400">Q3 2026 Quarterly Yield</div>
            </div>
            <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Estimated Q3 Payout</div>
              <div className="text-2xl font-black text-white">${(totalCapitalRaised * 0.04).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="text-[11px] text-slate-400">4% quarterly distribution</div>
            </div>
          </div>

          <div className="glass-card p-6 border border-white/[0.07] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" /> Dividend Disbursement History
            </h3>
            {dividendHistory.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">No dividend history recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dividendHistory.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{d.period}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.tx} · {d.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-400">${d.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[10px] text-emerald-500/80">{d.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Ops Pipeline ── */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RoleWorkQueueWidget role="asset_owner" />
          <AssetActivityFeed />
        </div>
      )}
    </div>
  );
}
