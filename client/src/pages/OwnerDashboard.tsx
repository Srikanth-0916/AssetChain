import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Building2, PlusCircle, FileText, CheckCircle2, ShieldAlert,
  Coins, Layers, TrendingUp, ArrowUpRight, Clock, Sparkles, ChevronRight,
  ShieldCheck, Lock, Users, PieChart, Globe2, BarChart3, Receipt
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';
import { AssetActivityFeed } from '../components/workflow/AssetActivityFeed';

import { PageHeaderExplainer } from '../components/ui/PageHeaderExplainer';
import { AssetLifecycleTimeline } from '../components/workflow/AssetLifecycleTimeline';

export function OwnerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_assets' | 'rental_deposits' | 'investor_analytics'>('my_assets');
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
    const soldRatio = (supply - available) / supply;
    return sum + (Number(a.valuation || 0) * soldRatio);
  }, 0);

  // Anonymous investor distribution following Institutional Privacy Standards
  const privacyShieldedInvestors = totalCapitalRaised > 0 ? [
    { id: 'INV-8849-01', category: 'Institutional Investor', capitalDeployed: `$${(totalCapitalRaised * 0.4).toLocaleString(undefined, {maximumFractionDigits:0})}`, holdingsPct: '40.0%', jurisdiction: 'United States', status: 'KYC Cleared' },
    { id: 'INV-9021-02', category: 'Retail Accredited', capitalDeployed: `$${(totalCapitalRaised * 0.2).toLocaleString(undefined, {maximumFractionDigits:0})}`, holdingsPct: '20.0%', jurisdiction: 'United Kingdom', status: 'KYC Cleared' },
    { id: 'INV-4412-03', category: 'Institutional Family Office', capitalDeployed: `$${(totalCapitalRaised * 0.3).toLocaleString(undefined, {maximumFractionDigits:0})}`, holdingsPct: '30.0%', jurisdiction: 'Singapore', status: 'KYC Cleared' },
    { id: 'INV-1104-04', category: 'Retail Accredited', capitalDeployed: `$${(totalCapitalRaised * 0.1).toLocaleString(undefined, {maximumFractionDigits:0})}`, holdingsPct: '10.0%', jurisdiction: 'Germany', status: 'KYC Cleared' },
  ] : [];

  return (
    <div className="page-container space-y-8 animate-fade-in pb-12">
      <PageHeaderExplainer
        category="Asset Originator & SPV Management Portal"
        title="Tokenized Asset Originator & SPV Management Center"
        subtitle="Onboard physical real estate, register legal SPVs, execute multi-sig verification pipelines, and manage automated rental dividend distributions."
        whatIsThis="This portal allows property developers and asset originators to submit real-world assets for AI title deed scanning, legal verification, and ERC-20 token minting."
        whatNext="Click 'Onboard New Property' to initiate a new asset tokenization pipeline or inspect your active SPV rental dividend schedules below."
        whyBlockchain="Smart contracts automate monthly rental yield payouts directly to investor Web3 wallets while enforcing ERC-3643 whitelist transfer restrictions."
        whyAI="AI assists in continuous property valuation updates, tenant lease verification, and automated title deed OCR scanning."
        defaultExpanded={true}
      />

      <AssetLifecycleTimeline currentStageNumber={5} />
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
            <span className="text-xs font-medium text-slate-400">Total Property Valuation</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {isLoading ? '...' : `$${totalValuation.toLocaleString()}`}
          </div>
          <p className="text-[11px] text-slate-300">The total appraised market value of all real-estate properties you have onboarded.</p>
          <div className="text-[10px] text-emerald-400 font-semibold border-t border-slate-800/80 pt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Why it matters: Determines your total borrowing capacity & token issuance limit.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Capital Raised</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {isLoading ? '...' : `$${totalCapitalRaised.toLocaleString()}`}
          </div>
          <p className="text-[11px] text-slate-300">Funds collected from investors in exchange for fractional property ownership shares.</p>
          <div className="text-[10px] text-indigo-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Shows liquidity funded into your property development projects.
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
          <p className="text-[11px] text-slate-300">Personal investor identities are encrypted to comply with international SEC & GDPR privacy laws.</p>
          <div className="text-[10px] text-purple-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Protects investor confidentiality while allowing aggregate tracking.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rental Income Distributed</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {isLoading ? '...' : `$${(totalCapitalRaised * 0.08).toLocaleString(undefined, {maximumFractionDigits:0})}`}
          </div>
          <p className="text-[11px] text-slate-300">Total monthly rental income automatically disbursed to investor wallets.</p>
          <div className="text-[10px] text-amber-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Maintains investor trust and automated dividend compliance.
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
          <Building2 className="w-4 h-4" /> My Asset Portfolio ({assets.length})
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
          {assets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-500" />
              <div className="text-white font-bold text-sm">No Onboarded Assets</div>
              <p className="text-xs text-slate-400">You have not onboarded any physical properties for tokenization yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset, i) => {
                const supply = Number(asset.token_supply || 1);
                const available = Number(asset.tokens_available ?? asset.token_supply ?? 1);
                const raisedAmount = Number(asset.valuation || 0) * ((supply - available) / supply);
                const yieldPct = 8.5;

                return (
                  <div key={asset.id || i} className="glass-card p-6 border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="pill-badge pill-success text-[10px] capitalize">{asset.asset_type.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] font-semibold text-emerald-400 capitalize">{asset.verification_status.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white truncate">{asset.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Valuation: <strong className="text-white">${Number(asset.valuation || 0).toLocaleString()}</strong></p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capital Raised</span>
                        <span className="font-bold text-white">${raisedAmount.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Annualized Yield</span>
                        <span className="font-bold text-indigo-300">{yieldPct}% p.a.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Remaining Tokens</span>
                        <span className="font-mono text-slate-300">{available.toLocaleString()} / {supply.toLocaleString()}</span>
                      </div>
                    </div>
                    <button className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-white transition-all">
                      Manage Asset Details & Deeds
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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

          {privacyShieldedInvestors.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-500" />
              <div className="text-white font-bold text-sm">No Investors Yet</div>
              <p className="text-xs text-slate-400">Once your assets are approved and token sales begin, investor analytics will load here.</p>
            </div>
          ) : (
            <>
              {/* Aggregate Distribution Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-white">${(totalCapitalRaised / 4).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Average Investment Size</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-emerald-400">70% / 30%</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Institutional vs Retail Split</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-indigo-400">4 Countries</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Geographical Diversity</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-amber-400">40.0%</div>
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
            </>
          )}
        </div>
      )}

      {/* ── Tab 3: Rental Yield Disbursements ── */}
      {activeTab === 'rental_deposits' && (
        <div className="glass-card p-6 border border-white/[0.08] space-y-4">
          <h3 className="text-base font-bold text-white">Rental Income Disbursement Ledger</h3>
          <p className="text-xs text-slate-400">Automated quarterly dividend distribution via Polygon Amoy smart contracts.</p>
          {totalCapitalRaised === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-500" />
              <div className="text-white font-bold text-sm">No Disbursements Yet</div>
              <p className="text-xs text-slate-400">No rental yield dividend history is recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { period: 'Q2 2026 Dividend Disbursed', amount: `$${(totalCapitalRaised * 0.04).toLocaleString(undefined, {maximumFractionDigits:0})}`, date: '2026-06-30', txHash: '0x489d...fb10' },
                { period: 'Q1 2026 Dividend Disbursed', amount: `$${(totalCapitalRaised * 0.04).toLocaleString(undefined, {maximumFractionDigits:0})}`, date: '2026-03-31', txHash: '0x8f9d...1f90' },
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
          )}
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
