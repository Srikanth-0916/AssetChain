import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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

const INVESTMENTS_DATA = [
  {
    id: 'inv-001',
    assetId: 'ast-001',
    title: 'Manhattan Commercial Plaza',
    assetType: 'Commercial Real Estate',
    location: 'New York, USA',
    investmentValue: 625000,
    currentValue: 713750,
    roi: 14.2,
    tokensOwned: 2500,
    tokenPrice: 285.50,
    ownershipPct: 25.0,
    dividendEarned: 48250,
    yieldPct: 8.2,
    trustScore: 94,
    riskRating: 'Low Risk',
    legalStatus: 'Title Deed Verified (ERC-3643)',
    txHash: '0x8f9d19d0be744cb7bf20e87488da1f90',
  },
  {
    id: 'inv-002',
    assetId: 'ast-002',
    title: 'Solar Farm Alpha 1',
    assetType: 'Renewable Energy',
    location: 'Valencia, Spain',
    investmentValue: 240000,
    currentValue: 262800,
    roi: 9.5,
    tokensOwned: 2000,
    tokenPrice: 131.40,
    ownershipPct: 20.0,
    dividendEarned: 18900,
    yieldPct: 9.5,
    trustScore: 91,
    riskRating: 'Low Risk',
    legalStatus: 'PPA Agreement Active',
    txHash: '0x489d0e7e68004abb8ccdd5280a7cfb10',
  },
  {
    id: 'inv-003',
    assetId: 'ast-003',
    title: 'Luxury Beachfront Villa Compound',
    assetType: 'Residential Real Estate',
    location: 'Dubai Marina, UAE',
    investmentValue: 450000,
    currentValue: 486000,
    roi: 8.0,
    tokensOwned: 1000,
    tokenPrice: 486.00,
    ownershipPct: 10.0,
    dividendEarned: 32400,
    yieldPct: 7.8,
    trustScore: 89,
    riskRating: 'Medium Risk',
    legalStatus: 'Dubai Land Dept Registered',
    txHash: '0x7e388ac818724f0ca7b11fe283c633e2',
  },
];

export function InvestorDashboard() {
  const { user } = useAuth();
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'history' | 'documents' | 'governance'>('details');
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div className="page-container space-y-8 animate-fade-in pb-12">
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
          <div className="text-2xl font-extrabold text-white tracking-tight">$1,462,550</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +11.23% Total ROI (+$147,550)
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cumulative Dividends Earned</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">$99,550</div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <span>Avg Yield: 8.50% p.a.</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active RWA Positions</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">3 Holdings</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>100% On-Chain Tokenized</span>
          </div>
        </div>

        <div className="glass-card p-5 space-y-2 relative overflow-hidden border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Trust & Compliance Status</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">94 / 100</div>
          <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ERC-3643 Whitelisted
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
          <div className="text-xs text-slate-400">Showing {INVESTMENTS_DATA.length} Active Holdings</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INVESTMENTS_DATA.map((inv) => (
            <div
              key={inv.id}
              className="glass-card-hover p-6 border border-white/[0.08] flex flex-col justify-between space-y-5 group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="pill-badge pill-success text-[10px] mb-1.5 inline-block">{inv.assetType}</span>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {inv.title}
                    </h3>
                    <p className="text-xs text-slate-400">{inv.location}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-400">{inv.trustScore}/100</div>
                    <div className="text-[9px] text-slate-500 uppercase font-semibold">Trust Score</div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 my-4 text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px]">Invested Value</div>
                    <div className="font-bold text-white">${inv.investmentValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Current Valuation</div>
                    <div className="font-bold text-emerald-400">${inv.currentValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Tokens / Ownership</div>
                    <div className="font-semibold text-slate-200">{inv.tokensOwned} ({inv.ownershipPct}%)</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Dividend Earned</div>
                    <div className="font-semibold text-amber-400">+${inv.dividendEarned.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Total ROI: <strong className="text-emerald-400">+{inv.roi}%</strong></span>
                  <span className="text-slate-400">Yield: <strong className="text-indigo-300">{inv.yieldPct}% p.a.</strong></span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedInvestment(inv);
                  setActiveDrawerTab('details');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
              >
                Open Asset Workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
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
