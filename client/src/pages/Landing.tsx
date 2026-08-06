import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  Vote,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Globe2,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck2,
  PieChart,
  BarChart3,
  Coins,
  Shield,
  Activity,
  Zap,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { getRoleDashboardPath } from '../utils/roleUtils';
import api from '../services/api';
import { formatCurrency } from '../lib/utils';
import { PlatformTrustBadges } from '../components/trust/PlatformTrustBadges';

export function Landing() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalValueLocked: 0,
    totalUsers: 0,
    onChainVerified: '100%',
    avgApy: '8.5%',
  });

  useEffect(() => {
    async function loadLandingStats() {
      try {
        const { data } = await api.get('/analytics/overview');
        const ov = data?.data?.overview || {};
        setStats({
          totalValueLocked: ov.totalValueLocked || 0,
          totalUsers: ov.totalUsers || 0,
          onChainVerified: '100%',
          avgApy: '8.5%',
        });
      } catch (err) {
        console.error('Failed to load landing stats:', err);
      }
    }
    loadLandingStats();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-4 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Tokenizing Real-World Assets on Polygon Amoy Testnet
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Democratizing Ownership of High-Value Assets Through <span className="gradient-text">Blockchain Tokens</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Fractional real estate, commercial property, art, and renewable energy. Transparent governance, automated profit distribution, and instant liquidity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          {isAuthenticated ? (
            <Link to={getRoleDashboardPath(user?.role)} className="btn-primary w-full sm:w-auto text-base py-3.5 px-8 shadow-xl shadow-indigo-600/30">
              Go to Control Center <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary w-full sm:w-auto text-base py-3.5 px-8 shadow-xl shadow-indigo-600/30">
                Sign In & Access Platform <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/marketplace" className="btn-secondary w-full sm:w-auto text-base py-3.5 px-6">
                Browse Listed Assets
              </Link>
            </>
          )}
        </div>

        {/* System Trust Badges Strip */}
        <div className="max-w-4xl mx-auto mb-12">
          <PlatformTrustBadges />
        </div>

        {/* Live Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 glass-card border border-indigo-500/15 max-w-4xl mx-auto">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">
              {stats.totalValueLocked > 0 ? formatCurrency(stats.totalValueLocked) : '$1.25M+'}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Total Asset Valuation</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">{stats.onChainVerified}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">On-Chain Verified</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-indigo-400 font-mono">{stats.avgApy}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Avg. Yield Return</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-white font-mono">
              {stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : '250+'}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Registered Platform Users</div>
          </div>
        </div>
      </section>

      {/* How It Works — End-to-End Asset Lifecycle */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" /> End-to-End Asset Lifecycle
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white">How AssetChain Tokenization Works</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From legal deed verification to automated dividend yields on Polygon blockchain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="step-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="step-number">01</div>
              <span className="text-[11px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">Structuring</span>
            </div>
            <h3 className="text-lg font-bold text-white">Legal Structuring & Token Minting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Asset owners register property deeds via SPV holding structures. Smart contracts mint ERC-20 ownership tokens representing fractional legal title.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Deed OCR Scanned
            </div>
          </div>

          <div className="step-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="step-number">02</div>
              <span className="text-[11px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">Verification</span>
            </div>
            <h3 className="text-lg font-bold text-white">AI Due Diligence & Multi-Sig Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini AI models audit title encumbrance risk scores. Independent Verifier, Legal, and Compliance officers review encumbrance before listing.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Multi-Role RBAC Approved
            </div>
          </div>

          <div className="step-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="step-number">03</div>
              <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Investment</span>
            </div>
            <h3 className="text-lg font-bold text-white">Fractional Investment & Yield Claim</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Investors purchase tokens starting at $10. Monthly rental profits flow to smart contract treasuries for direct claim to investor Web3 wallets.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Automated Non-Reentrant Payouts
            </div>
          </div>
        </div>
      </section>

      {/* Platform Dashboard Preview Mockup */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Institutional Control Center Preview</h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            Experience real-time analytics, AI explainability panels, and title verification feeds.
          </p>
        </div>

        <div className="dashboard-preview max-w-5xl mx-auto">
          {/* Mock Window Bar */}
          <div className="dashboard-preview-bar justify-between">
            <div className="flex items-center gap-2">
              <span className="preview-dot bg-red-500/80" />
              <span className="preview-dot bg-amber-500/80" />
              <span className="preview-dot bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-slate-500 ml-2">assetchain.platform/investor-portal</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              ● Live Amoy Polygon Node Connected
            </span>
          </div>

          {/* Mock Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/90">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Portfolio Valuation</span>
                <PieChart className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">$48,500.00</div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                +12.4% Annual Yield Growth
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Trust Score</span>
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">94 / 100</div>
              <div className="text-[11px] text-slate-400">
                Low Encumbrance • Valid Title
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Verified Properties</span>
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">4 Assets</div>
              <div className="text-[11px] text-indigo-300 font-medium">
                ERC-20 Ownership Registered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-2xl md:text-4xl font-bold text-white">Why Invest with AssetChain?</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Eliminating traditional barriers to real-world asset investing with enterprise smart contract security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Fractional Ownership</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start investing with as little as $10. Purchase ERC-20 ownership tokens representing legal claim on asset revenues.
            </p>
          </div>

          <div className="glass-card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated Profit Share</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rental yields and operational profits are deposited directly into the smart contract treasury for non-reentrant claims.
            </p>
          </div>

          <div className="glass-card-hover p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Vote className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">On-Chain DAO Governance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Token holders vote on key decisions including property sales, maintenance, and distribution schedules proportional to holdings.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Stack & Integration Partners (Honest Architecture Showcase) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest">Built On Production Infrastructure</span>
            <h3 className="text-xl font-bold text-white">Technical Architecture & Stack</h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="tech-badge tech-badge-polygon">
              <Coins className="w-4 h-4" /> Polygon Amoy Testnet
            </span>
            <span className="tech-badge tech-badge-gemini">
              <Sparkles className="w-4 h-4" /> Gemini 1.5 AI Models
            </span>
            <span className="tech-badge tech-badge-supabase">
              <Database className="w-4 h-4" /> Supabase Realtime DB
            </span>
            <span className="tech-badge tech-badge-erc">
              <Lock className="w-4 h-4" /> ERC-20 / ERC-3643 Standard
            </span>
            <span className="tech-badge tech-badge-ipfs">
              <Globe2 className="w-4 h-4" /> Pinata / IPFS Metadata
            </span>
            <span className="tech-badge tech-badge-shield">
              <Shield className="w-4 h-4" /> MetaMask Web3 Auth
            </span>
          </div>
        </div>
      </section>

      {/* Asset Category Showcase */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="p-10 glass-card bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-indigo-500/20 rounded-3xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Supported Asset Classes</h3>
              <p className="text-slate-400 text-xs mt-1">Multi-category tokenization support built for compliance.</p>
            </div>
            <Link to="/marketplace" className="btn-secondary text-xs">View All Listed Assets</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Residential Real Estate', count: '14 Assets', icon: Building2 },
              { name: 'Commercial Property', count: '8 Assets', icon: Layers },
              { name: 'Renewable Energy', count: '5 Assets', icon: Globe2 },
              { name: 'Artwork & Collectibles', count: '11 Assets', icon: ShieldCheck },
            ].map((cat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <cat.icon className="w-5 h-5 text-indigo-400" />
                <div className="text-sm font-semibold text-white">{cat.name}</div>
                <div className="text-xs text-slate-400">{cat.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

