import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import {
  TrendingUp, Coins, ShieldCheck, Wallet, ArrowUpRight,
  PieChart, BarChart3, Clock, Layers, Building2,
  Sparkles, CheckCircle2, ChevronRight, MessageSquare, Download,
  ExternalLink, FileText, ArrowRight, X, Award,
  Activity, Star, Target, Zap, Globe2,
} from 'lucide-react';
import { DigitalDataRoom } from '../components/trust/DigitalDataRoom';
import { AssetTimelineComponent } from '../components/trust/AssetTimelineComponent';
import { CapTableWidget } from '../components/trust/CapTableWidget';
import { AssetPerformanceChart } from '../components/trust/AssetPerformanceChart';
import { TrustScoreExplainability } from '../components/explainability/TrustScoreExplainability';
import { InvestorPassportModal } from '../components/trust/InvestorPassportModal';
import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';
import { AssetActivityFeed } from '../components/workflow/AssetActivityFeed';
import { FundingBreakdownWidget } from '../components/workflow/FundingBreakdownWidget';
import { ReportGeneratorModal } from '../components/workflow/ReportGeneratorModal';
import { AssetLifecycleTimeline } from '../components/workflow/AssetLifecycleTimeline';
import { RealTimeAssetMonitor } from '../components/monitoring/RealTimeAssetMonitor';
import { portfolioService } from '../services/portfolioService';

// ─── Animated Stat Card ───────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, accent = 'indigo', delay = 0,
}: { label: string; value: string; sub?: string; icon: React.ReactNode; accent?: string; delay?: number }) {
  const accentMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'rgba(99,102,241,0.12)' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'rgba(245,158,11,0.08)' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'rgba(16,185,129,0.10)' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'rgba(168,85,247,0.08)' },
  };
  const a = accentMap[accent] ?? accentMap.indigo;

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
        <div className={`text-2xl font-extrabold text-white tracking-tight`}>{value}</div>
        {sub && <div className={`text-[11px] font-medium ${a.text} flex items-center gap-1`}><ArrowUpRight className="w-3 h-3" />{sub}</div>}
      </div>
    </motion.div>
  );
}

// ─── Investment Card ──────────────────────────────────────────────────────────
function InvestmentCard({ inv, onSelect }: { inv: any; onSelect: (inv: any) => void }) {
  const assetTitle = inv.asset?.title || 'Asset Listing';
  const assetLocation = inv.asset?.location || 'Global';
  const assetType = inv.asset?.asset_type || 'RWA';
  const trustScore = inv.asset?.verification_status === 'tokenized' ? 95 : 75;
  const investmentValue = inv.investment_amount || 0;
  const currentValue = inv.current_value || investmentValue;
  const tokensOwned = inv.tokens_owned || 0;
  const claimedDividends = inv.claimed_dividends || 0;
  const totalRoiPercent = inv.total_roi_percent || 0;
  const yieldPct = 8.5;
  const gain = currentValue - investmentValue;
  const gainPct = investmentValue > 0 ? ((gain / investmentValue) * 100).toFixed(1) : '0.0';
  const isPositive = gain >= 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative rounded-2xl overflow-hidden border border-white/[0.07] group cursor-pointer"
      style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(9,14,31,0.95) 100%)', backdropFilter: 'blur(20px)' }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-600" />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {assetType.replace(/_/g, ' ')}
            </span>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">{assetTitle}</h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Globe2 className="w-3 h-3" /> {assetLocation}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-lg font-black ${trustScore >= 90 ? 'text-emerald-400' : trustScore >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
              {trustScore}
            </div>
            <div className="text-[9px] text-slate-500 uppercase font-bold">Trust</div>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Invested</div>
            <div className="text-sm font-bold text-white">${investmentValue.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Current Value</div>
            <div className="text-sm font-bold text-emerald-400">${currentValue.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Tokens Owned</div>
            <div className="text-sm font-semibold text-slate-200">{tokensOwned.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="text-[10px] text-slate-500 mb-0.5">Dividends</div>
            <div className="text-sm font-bold text-amber-400">+${claimedDividends.toLocaleString()}</div>
          </div>
        </div>

        {/* ROI / Yield Strip */}
        <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <span className={`font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90" />}
            {gainPct}% ROI
          </span>
          <span className="text-slate-400">Yield: <strong className="text-indigo-300">{yieldPct}% p.a.</strong></span>
        </div>

        <button
          onClick={() => onSelect({ ...inv, assetTitle, assetLocation, assetType, trustScore, investmentValue, currentValue, tokensOwned, dividendEarned: claimedDividends, yieldPct, roi: totalRoiPercent })}
          className="w-full py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-400 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-900/40"
        >
          Open Investment Workspace <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function InvestorDashboard() {
  const { user } = useAuth();
  const { address } = useWallet();
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'history' | 'documents'>('details');
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'monitoring' | 'analytics' | 'ai'>('portfolio');

  useEffect(() => {
    async function loadPortfolio() {
      if (!user) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res = await portfolioService.getPortfolio();
        setPortfolioData(res);
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortfolio();
  }, [user?.id]);

  const holdings = portfolioData?.holdings || [];
  const summary = portfolioData?.summary;
  const totalValue = summary?.current_value ?? 0;
  const cumulativeDividends = summary?.unclaimed_dividends ?? 0;
  const activeHoldingsCount = holdings.length;
  const avgYield = 8.5;

  const firstName = user?.full_name?.split(' ')[0] || 'Investor';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto space-y-8 pb-16">

      {/* ── Hero Header Banner (Investor-specific: deep indigo/violet gradient) ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(49,46,129,0.6) 0%, rgba(15,23,42,0.95) 50%, rgba(10,18,40,0.98) 100%)' }}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 left-[20%] w-[500px] h-[300px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-10 right-[10%] w-[300px] h-[250px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />
        {/* Border */}
        <div className="absolute inset-0 rounded-3xl border border-indigo-500/20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 p-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Star className="w-3 h-3" /> Accredited Investor Portal
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" /> Polygon Amoy · Live
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {greeting}, <span className="gradient-text">{firstName}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg">
              Your tokenized real estate portfolio — live market valuation, rental yield tracking, legal deed verification, and AI copilot intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={() => setIsReportOpen(true)} className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Export Reports
            </button>
            <button onClick={() => setIsPassportOpen(true)} className="px-3.5 py-2.5 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" /> Investor Passport
            </button>
            <Link to="/marketplace" className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 shadow-lg shadow-indigo-600/20">
              <Building2 className="w-4 h-4" /> Browse Marketplace
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Portfolio Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Portfolio Value"
          value={isLoading ? '—' : `$${totalValue.toLocaleString()}`}
          sub="Live market valuation"
          icon={<Wallet className="w-4 h-4" />}
          accent="indigo"
          delay={0.05}
        />
        <StatCard
          label="Cumulative Rental Income"
          value={isLoading ? '—' : `$${cumulativeDividends.toLocaleString()}`}
          sub="Passive yield earned"
          icon={<Coins className="w-4 h-4" />}
          accent="amber"
          delay={0.1}
        />
        <StatCard
          label="Active Holdings"
          value={isLoading ? '—' : `${activeHoldingsCount} Properties`}
          sub="Diversified RWA exposure"
          icon={<Building2 className="w-4 h-4" />}
          accent="emerald"
          delay={0.15}
        />
        <StatCard
          label="Avg. Annual Yield"
          value={`${avgYield}% p.a.`}
          sub={address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'Wallet pending'}
          icon={<ShieldCheck className="w-4 h-4" />}
          accent="purple"
          delay={0.2}
        />
      </div>

      {/* ── Asset Lifecycle Timeline ── */}
      <AssetLifecycleTimeline currentStageNumber={7} />

      {/* ── Main Tab Navigation ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/60 border border-white/[0.06] w-fit flex-wrap">
        {([
          { id: 'portfolio', label: 'My Investments', icon: <PieChart className="w-3.5 h-3.5" /> },
          { id: 'monitoring', label: 'Live Asset Monitor', icon: <Activity className="w-3.5 h-3.5 text-emerald-400" /> },
          { id: 'analytics', label: 'Analytics & Reports', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'ai', label: 'AI Copilot', icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:text-white'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Portfolio ── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Investment Holdings</h2>
              <p className="text-xs text-slate-400">Each holding is an independent tokenized RWA instrument on Polygon.</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              {holdings.length} Active
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 rounded-2xl bg-slate-900/60 border border-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : holdings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-14 text-center rounded-3xl border border-dashed border-indigo-500/20 bg-indigo-950/10 space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Welcome to AssetChain</h3>
              <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
                You haven't invested in any properties yet. Browse our marketplace to purchase your first fractional property investment.
              </p>
              <Link to="/marketplace" className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2 mt-2">
                <Building2 className="w-4 h-4" /> Explore Marketplace <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {holdings.map((inv: any) => (
                <InvestmentCard key={inv.id || inv.asset_id} inv={inv} onSelect={setSelectedInvestment} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Live Asset Monitor ── */}
      {activeTab === 'monitoring' && (
        <RealTimeAssetMonitor holdings={holdings} userWalletAddress={address} />
      )}

      {/* ── Tab: Analytics ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetPerformanceChart />
            <CapTableWidget />
          </div>
          <AssetTimelineComponent />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoleWorkQueueWidget role="investor" />
            <FundingBreakdownWidget />
          </div>
        </div>
      )}

      {/* ── Tab: AI Copilot ── */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrustScoreExplainability />
            <DigitalDataRoom assetTitle={selectedInvestment?.assetTitle || 'Manhattan Commercial Plaza'} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetActivityFeed />
            <div className="glass-card p-5 border border-purple-500/20 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-purple-400" /> AI Portfolio Intelligence
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Portfolio Diversification Score', value: '87/100', color: 'text-emerald-400' },
                  { label: 'Risk-Adjusted Return Estimate', value: '11.2%', color: 'text-indigo-400' },
                  { label: 'AI Confidence in Holdings', value: '94%', color: 'text-purple-400' },
                  { label: 'Recommended Action', value: 'Hold & Accumulate', color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs border-b border-white/[0.05] pb-2.5 last:border-0">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
              <Link to="/ai-copilot" className="w-full py-2.5 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-600 hover:text-white transition-all">
                Open Full AI Copilot <MessageSquare className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Investment Workspace Drawer ── */}
      {selectedInvestment && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end"
          onClick={() => setSelectedInvestment(null)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl h-full bg-[#0a0f1e] border-l border-indigo-500/20 p-6 overflow-y-auto space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                  {selectedInvestment.assetType}
                </span>
                <h2 className="text-2xl font-black text-white mt-2 tracking-tight">{selectedInvestment.assetTitle}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Globe2 className="w-3 h-3" /> {selectedInvestment.assetLocation} · Survey Certified
                </p>
              </div>
              <button onClick={() => setSelectedInvestment(null)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <div className="text-xs text-slate-400">Current Value</div>
                <div className="text-xl font-black text-white mt-1">${selectedInvestment.currentValue?.toLocaleString() ?? 0}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">+{selectedInvestment.roi}% ROI</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/15">
                <div className="text-xs text-slate-400">Dividends Earned</div>
                <div className="text-xl font-black text-amber-400 mt-1">${selectedInvestment.dividendEarned?.toLocaleString() ?? 0}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{selectedInvestment.yieldPct}% p.a. yield</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/[0.06] pb-3 text-xs">
              {(['details', 'history', 'documents'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDrawerTab(tab)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all capitalize ${activeDrawerTab === tab ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab === 'details' ? 'Performance' : tab === 'history' ? 'Transactions' : 'Legal Deeds'}
                </button>
              ))}
            </div>

            {activeDrawerTab === 'details' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-purple-400" /> AI Copilot Intelligence
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This asset exhibits a strong occupancy profile with low legal encumbrance score ({selectedInvestment.trustScore}/100). Dividend yield matches Q3 target expectations. AI recommends: <strong className="text-emerald-400">Hold & Accumulate</strong>.
                  </p>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Trust Score', value: `${selectedInvestment.trustScore}/100`, color: 'text-emerald-400' },
                    { label: 'Tokens Owned', value: selectedInvestment.tokensOwned?.toLocaleString() ?? '0', color: 'text-white' },
                    { label: 'Annual Yield', value: `${selectedInvestment.yieldPct}% p.a.`, color: 'text-indigo-300' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center py-2.5 border-b border-white/[0.05]">
                      <span className="text-slate-400">{label}</span>
                      <span className={`font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDrawerTab === 'history' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Q3 Dividend Distribution Payout</div>
                    <div className="text-slate-400 text-[10px]">On-Chain Polygon Amoy Deposit</div>
                  </div>
                  <div className="text-right font-bold text-emerald-400">+${selectedInvestment.dividendEarned ?? 0}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Initial Token Purchase</div>
                    <div className="text-slate-400 text-[10px] font-mono">0x489d...fb10</div>
                  </div>
                  <div className="text-right font-bold text-slate-300">${selectedInvestment.investmentValue?.toLocaleString() ?? 0}</div>
                </div>
              </div>
            )}

            {activeDrawerTab === 'documents' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-white">Sub-Registrar Title Deed PDF</div>
                      <div className="text-[10px] text-emerald-400">Verified & Encumbrance Cleared · AES-256 Encrypted</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold text-white">SPV Legal Agreement</div>
                      <div className="text-[10px] text-slate-400">ERC-3643 Token Compliance Doc</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Institutional Modals ── */}
      <InvestorPassportModal isOpen={isPassportOpen} onClose={() => setIsPassportOpen(false)} />
      <ReportGeneratorModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
