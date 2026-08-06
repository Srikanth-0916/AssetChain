import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import {
  TrendingUp, Coins, ShieldCheck, Wallet, ArrowUpRight,
  PieChart, BarChart3, Clock, AlertTriangle, Layers, Building2,
  Sparkles, CheckCircle2, ChevronRight, MessageSquare, Download,
  ExternalLink, FileText, ArrowRight, X, User, Award
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { DigitalDataRoom } from '../components/trust/DigitalDataRoom';
import { AssetTimelineComponent } from '../components/trust/AssetTimelineComponent';
import { CapTableWidget } from '../components/trust/CapTableWidget';
import { AssetPerformanceChart } from '../components/trust/AssetPerformanceChart';
import { TrustScoreExplainability } from '../components/explainability/TrustScoreExplainability';
import { AssetHealthBreakdown } from '../components/explainability/AssetHealthBreakdown';
import { InvestorPassportModal } from '../components/trust/InvestorPassportModal';
import { RoleWorkQueueWidget } from '../components/workflow/RoleWorkQueueWidget';
import { AssetActivityFeed } from '../components/workflow/AssetActivityFeed';
import { FundingBreakdownWidget } from '../components/workflow/FundingBreakdownWidget';
import { ReportGeneratorModal } from '../components/workflow/ReportGeneratorModal';

import { PageHeaderExplainer } from '../components/ui/PageHeaderExplainer';
import { AssetLifecycleTimeline } from '../components/workflow/AssetLifecycleTimeline';

import { portfolioService } from '../services/portfolioService';




export function InvestorDashboard() {
  const { user } = useAuth();
  const { address } = useWallet();
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      if (!user) {
        setPortfolioData(null);
        setIsLoading(false);
        return;
      }
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

  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'history' | 'documents' | 'governance'>('details');
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const holdings = portfolioData?.holdings || [];
  const summary = portfolioData?.summary;

  const totalValue = summary ? summary.current_value : (portfolioData ? 0 : 0);
  const cumulativeDividends = summary ? summary.unclaimed_dividends : (portfolioData ? 0 : 0);
  const activeHoldingsCount = summary ? holdings.length : (portfolioData ? 0 : 0);
  const displayInvestments = holdings.length > 0 ? holdings : (portfolioData ? [] : []);

  return (
    <div className="page-container space-y-8 animate-fade-in pb-12">
      <PageHeaderExplainer
        category="Accredited Investor Portal"
        title="Your Fractional Real Estate & RWA Investments"
        subtitle="Manage your tokenized real estate portfolio, inspect audited title deeds, track monthly rental distributions, and participate in DAO governance."
        whatIsThis="This dashboard displays your active fractional token holdings, quarterly dividend yields, verified SPV legal documents, and AI health scores."
        whatNext="Explore new tokenized properties in the Marketplace or vote on active DAO governance proposals below."
        whyBlockchain="Your token ownership is cryptographically registered on Polygon Amoy blockchain with ERC-3643 transfer restrictions and automated dividend distribution."
        whyAI="AI continuously monitors property market valuation, rental cash flow stability, and municipal title encumbrance status."
        defaultExpanded={true}
      />

      <AssetLifecycleTimeline currentStageNumber={7} />
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Investor Control Center
            </span>
            <span className="text-xs text-slate-400">• Polygon Amoy Connected</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Investor Control Center — {user?.full_name || 'Accredited Investor'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Real-time portfolio management, individual investment breakdown, title deed verification, and AI yields.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-indigo-400" /> Export Reports
          </button>
          <button
            onClick={() => setIsPassportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4 text-purple-400" /> Investor Passport
          </button>
          <Link
            to="/marketplace"
            className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Building2 className="w-4 h-4" /> Browse Marketplace
          </Link>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Portfolio Value</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">${totalValue.toLocaleString()}</div>
          <p className="text-[11px] text-slate-300">The current market value of all real-world assets you own.</p>
          <div className="text-[10px] text-emerald-400 font-semibold border-t border-slate-800/80 pt-1.5 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Why it matters: Tracks your total wealth growth across all properties.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cumulative Rental Income</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">${cumulativeDividends.toLocaleString()}</div>
          <p className="text-[11px] text-slate-300">Total rental payments deposited directly to your portfolio.</p>
          <div className="text-[10px] text-amber-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Generates passive income without selling your property shares.
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Property Positions</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">{activeHoldingsCount} Properties</div>
          <p className="text-[11px] text-slate-300">The number of distinct tokenized real-estate assets in your portfolio.</p>
          <div className="text-[10px] text-indigo-300 font-semibold border-t border-slate-800/80 pt-1.5">
            Why it matters: Diversifies risk across different commercial & residential properties.
          </div>
        </div>

        {/* Web3 Wallet Layer Summary Card */}
        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">Wallet Ownership Verified</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-mono font-bold text-white truncate">
            {address ? `${address.slice(0, 10)}...${address.slice(-6)}` : 'Ownership Verification Pending'}
          </div>
          <p className="text-[11px] text-slate-300">Your secure digital key proving legal ownership of property tokens.</p>
          <div className="flex items-center justify-between text-[10px] border-t border-emerald-500/20 pt-1.5">
            <span className="text-emerald-400 font-semibold">Polygon Amoy (80002)</span>
            {address && (
              <a
                href={`https://amoy.polygonscan.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1"
              >
                Verify <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>


      {/* ── My Investments Grid (Individual Cards as Financial Instruments) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">My Investments</h2>
            <p className="text-xs text-slate-400">Each holding is an independent tokenized real-world asset instrument.</p>
          </div>
          <div className="text-xs text-slate-400">Showing {displayInvestments.length} Active Holdings</div>
        </div>

        {displayInvestments.length === 0 ? (
          <div className="p-12 text-center glass-card border border-indigo-500/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Welcome to AssetChain.</h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              You haven't invested in any properties yet. Browse the Marketplace to purchase your first fractional property investment.
            </p>
            <div className="pt-2">
              <Link to="/marketplace" className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Browse Marketplace <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayInvestments.map((inv: any) => {
              const assetTitle = inv.asset?.title || 'Asset Listing';
              const assetLocation = inv.asset?.location || 'Global Location';
              const assetType = inv.asset?.asset_type || 'RWA';
              const trustScore = inv.asset?.verification_status === 'tokenized' ? 95 : 75;
              const investmentValue = inv.investment_amount || 0;
              const currentValue = inv.current_value || investmentValue;
              const tokensOwned = inv.tokens_owned || 0;
              const averageBuyPrice = inv.average_buy_price || 0;
              const tokenPrice = inv.asset?.token_price || averageBuyPrice;
              const ownershipPct = ((investmentValue / 1000000) * 100).toFixed(2);
              const claimedDividends = inv.claimed_dividends || 0;
              const totalRoiPercent = inv.total_roi_percent || 0;
              const yieldPct = 8.5;
              const txHash = inv.txHash || '0x' + (inv.id || 'abc').slice(0, 8) + '...';

              return (
                <div
                  key={inv.id || inv.asset_id}
                  className="glass-card-hover p-6 border border-white/[0.08] flex flex-col justify-between space-y-5 group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="pill-badge pill-success text-[10px] mb-1.5 inline-block capitalize">{assetType.replace(/_/g, ' ')}</span>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {assetTitle}
                        </h3>
                        <p className="text-xs text-slate-400">{assetLocation}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-400">{trustScore}/100</div>
                        <div className="text-[9px] text-slate-500 uppercase font-semibold">Trust Score</div>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 my-4 text-xs">
                      <div>
                        <div className="text-slate-500 text-[10px]">Invested Value</div>
                        <div className="font-bold text-white">${investmentValue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Current Valuation</div>
                        <div className="font-bold text-emerald-400">${currentValue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Tokens / Ownership</div>
                        <div className="font-semibold text-slate-200">{tokensOwned} ({ownershipPct}%)</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Dividend Earned</div>
                        <div className="font-semibold text-amber-400">+${claimedDividends.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">Total ROI: <strong className="text-emerald-400">+{totalRoiPercent}%</strong></span>
                      <span className="text-slate-400">Yield: <strong className="text-indigo-300">{yieldPct}% p.a.</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInvestment({
                        ...inv,
                        title: assetTitle,
                        location: assetLocation,
                        assetType,
                        trustScore,
                        investmentValue,
                        currentValue,
                        tokensOwned,
                        tokenPrice,
                        dividendEarned: claimedDividends,
                        yieldPct,
                        roi: totalRoiPercent,
                        txHash,
                      });
                      setActiveDrawerTab('details');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                  >
                    Open Asset Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Asset Workspace Drawer Modal ── */}
      {selectedInvestment && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-fade-in"
          onClick={() => setSelectedInvestment(null)}
        >
          <div
            className="w-full max-w-2xl h-full bg-slate-900 border-l border-indigo-500/20 p-6 overflow-y-auto space-y-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="pill-badge pill-success text-[10px]">{selectedInvestment.assetType}</span>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedInvestment.title}</h2>
                <p className="text-xs text-slate-400">{selectedInvestment.location} • Survey Certified</p>
              </div>
              <button
                onClick={() => setSelectedInvestment(null)}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 text-xs">
              <button
                onClick={() => setActiveDrawerTab('details')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${activeDrawerTab === 'details' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Financial Performance
              </button>
              <button
                onClick={() => setActiveDrawerTab('history')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${activeDrawerTab === 'history' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Transactions & Dividends
              </button>
              <button
                onClick={() => setActiveDrawerTab('documents')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${activeDrawerTab === 'documents' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Legal Deeds & Verification
              </button>
            </div>

            {/* Drawer Content */}
            {activeDrawerTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-400">Current Market Price / Token</div>
                    <div className="text-xl font-bold text-white mt-1">${selectedInvestment.tokenPrice}</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">+{selectedInvestment.roi}% since purchase</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-400">Total Dividend Distributed</div>
                    <div className="text-xl font-bold text-amber-400 mt-1">${selectedInvestment.dividendEarned.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Annualized yield {selectedInvestment.yieldPct}% p.a.</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-purple-400" /> AI Copilot Intelligence Recommendation
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This asset exhibits a strong occupancy profile with low legal encumbrance score ({selectedInvestment.trustScore}/100). Dividend yield matches Q3 target expectations. Recommend holding position.
                  </p>
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
                  <div className="text-right font-bold text-emerald-400">+${selectedInvestment.dividendEarned}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Initial Token Purchase</div>
                    <div className="text-slate-400 text-[10px] font-mono">{selectedInvestment.txHash}</div>
                  </div>
                  <div className="text-right font-bold text-slate-300">${selectedInvestment.investmentValue.toLocaleString()}</div>
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
                      <div className="text-[10px] text-emerald-400">Verified & Encumbrance Cleared</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Actionable Work Queue & Capital Raise Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoleWorkQueueWidget role="investor" />
        <FundingBreakdownWidget />
      </div>

      {/* ── Institutional Analytics & Data Room Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetPerformanceChart />
        <CapTableWidget />
      </div>

      <AssetTimelineComponent />
      <DigitalDataRoom assetTitle={selectedInvestment?.title || 'Manhattan Commercial Plaza'} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrustScoreExplainability />
        <AssetActivityFeed />
      </div>

      {/* Institutional Modals */}
      <InvestorPassportModal isOpen={isPassportOpen} onClose={() => setIsPassportOpen(false)} />
      <ReportGeneratorModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
