import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, PlusCircle, FileText, CheckCircle2, ShieldAlert,
  Coins, Layers, TrendingUp, ArrowUpRight, Clock, Sparkles, ChevronRight
} from 'lucide-react';

export function OwnerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_assets' | 'rental_deposits' | 'investor_list'>('my_assets');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Asset Issuer & Owner Workspace
            </span>
            <span className="text-xs text-slate-400">• SPV Onboarding Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Asset Issuer Dashboard — {user?.full_name || 'Asset Owner'}
          </h1>
          <p className="text-xs text-slate-400">
            Tokenize real-world assets, upload legal title deeds, run land registry checks, and distribute rental dividends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/assets/create"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Onboard New Property
          </Link>
        </div>
      </div>

      {/* ── Issuer Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Asset Valuation</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">₹45,00,00,000</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 3 SPV Entities Onboarded
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Fraction Tokens Minted</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">10,000 Tokens</div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
            <span>ERC-3643 Polygon Amoy Verified</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verified Investors Count</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">1,420 Investors</div>
          <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
            <span>KYC & Sanctions Cleared</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Dividends Distributed</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">₹1,84,00,000</div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <span>10% TDS Deducted & Retained</span>
          </div>
        </div>
      </div>

      {/* ── My Onboarded Assets ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" /> My Managed Real-World Assets
          </h2>
          <Link to="/assets/create" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            + Onboard Asset <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4 border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                  ACTIVE & TOKENIZED
                </span>
                <h3 className="text-base font-bold text-white mt-1">BKC Prime Commercial Tower</h3>
                <p className="text-xs text-slate-400">Bandra Kurla Complex, Mumbai · Commercial Office</p>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                SPV #8849
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Valuation</span>
                <span className="font-bold text-white">₹25 Cr</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Occupancy</span>
                <span className="font-bold text-emerald-400">92%</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Rental Yield</span>
                <span className="font-bold text-amber-400">8.5% p.a.</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Title Deed Verified (SRO Bandra)
              </span>
              <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold transition-colors">
                Deposit Rental Income
              </button>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4 border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase">
                  ACTIVE & TOKENIZED
                </span>
                <h3 className="text-base font-bold text-white mt-1">Pavagada 50MW Solar Array</h3>
                <p className="text-xs text-slate-400">Tumkur, Karnataka · Clean Energy Solar Park</p>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                SPV #9912
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Valuation</span>
                <span className="font-bold text-white">₹12 Cr</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">PPA Contract</span>
                <span className="font-bold text-emerald-400">15 Years</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Annual Yield</span>
                <span className="font-bold text-amber-400">9.8% p.a.</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Title Deed Verified (Karnataka IGRS)
              </span>
              <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold transition-colors">
                Deposit Rental Income
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
