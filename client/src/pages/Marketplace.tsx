import React, { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';
import { marketplaceService } from '../services/marketplaceService';
import type { Asset } from '../types/asset';
import { ASSET_TYPE_LABELS } from '../types/asset';
import {
  Search, CheckCircle2, ShoppingBag, Zap,
  MapPin, TrendingUp, Shield, Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { PaymentModal } from '../components/payment/PaymentModal';
import { TrustScoreBadges } from '../components/trust/TrustScoreBadges';
import { ContextualAITip } from '../components/trust/ContextualAITip';
import { SkeletonGrid } from '../components/ui/SkeletonCard';
import { EmptyState } from '../components/ui/EmptyState';
import { TrustScorePanel } from '../components/explainability/TrustScorePanel';
import { ROIBreakdownPanel } from '../components/explainability/ROIBreakdownPanel';
import { RiskBreakdownPanel } from '../components/explainability/RiskBreakdownPanel';
import { AssetComparisonModal } from '../components/trust/AssetComparisonModal';
import { ExitSimulatorModal } from '../components/trust/ExitSimulatorModal';
import { DigitalDataRoom } from '../components/trust/DigitalDataRoom';
import { DueDiligenceReportModal } from '../components/trust/DueDiligenceReportModal';
import { Star, Scale, Calculator, FileText, Lock } from 'lucide-react';

// ─── Category filter config ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  real_estate:  'text-indigo-400',
  agriculture:  'text-emerald-400',
  energy:       'text-amber-400',
  infrastructure: 'text-cyan-400',
  commercial:   'text-violet-400',
};

const BG_GRADIENTS: Record<string, string> = {
  real_estate:  'from-indigo-900/70 via-slate-900 to-slate-950',
  agriculture:  'from-emerald-900/60 via-slate-900 to-slate-950',
  energy:       'from-amber-900/60 via-slate-900 to-slate-950',
  infrastructure:'from-cyan-900/60 via-slate-900 to-slate-950',
  commercial:   'from-violet-900/60 via-slate-900 to-slate-950',
};

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({
  item,
  onBuy,
}: {
  item: Asset;
  onBuy: (asset: Asset) => void;
}) {
  const gradientClass = BG_GRADIENTS[item.asset_type] ?? 'from-indigo-900/60 via-slate-900 to-slate-950';
  const colorClass    = CATEGORY_COLORS[item.asset_type] ?? 'text-indigo-400';
  const typeLabel     = ASSET_TYPE_LABELS[item.asset_type] ?? item.asset_type;

  return (
    <div className="asset-card group">
      {/* Card Image / Hero */}
      <div className={`relative h-44 bg-gradient-to-br ${gradientClass} flex items-end p-5 overflow-hidden`}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Glow orb */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 bg-indigo-500" />

        {/* Type tag */}
        <span className="asset-type-tag z-10">{typeLabel}</span>

        {/* Verified badge */}
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
          <Shield className="w-3 h-3" /> Verified
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-[0.9375rem] leading-snug truncate group-hover:text-indigo-300 transition-colors">
              {item.title}
            </h3>
            {item.location && (
              <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3" />{item.location}
              </p>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <TrustScoreBadges activeBadges={['legal', 'spv', 'multisig', 'blockchain']} />

        {/* Explainability row — Why? buttons for Trust, ROI and Risk */}
        <div className="flex flex-wrap items-center gap-2">
          <TrustScorePanel assetId={item.id} />
          <ROIBreakdownPanel
            assetType={item.asset_type}
            tokenPrice={Number(item.token_price)}
            valuation={Number(item.valuation)}
          />
          <RiskBreakdownPanel
            assetType={item.asset_type}
            fraudScore={15}
            liquidityIndex={85}
            riskTier="medium"
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/70 rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px] mb-0.5">Valuation</span>
            <span className="font-bold text-white">{formatCurrency(Number(item.valuation))}</span>
          </div>
          <div className="bg-slate-900/70 rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px] mb-0.5">Token Price</span>
            <span className={`font-bold ${colorClass}`}>${item.token_price}</span>
          </div>
        </div>

        {/* Available tokens progress */}
        {(item.tokens_available != null || (item as any).available_tokens != null) && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Tokens Available</span>
              <span className="text-slate-400 font-semibold">
                {Number(item.tokens_available ?? (item as any).available_tokens).toLocaleString()} / {Number(item.token_supply ?? (item as any).total_tokens).toLocaleString()}
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(
                    100,
                    (((Number(item.token_supply ?? (item as any).total_tokens) - Number(item.tokens_available ?? (item as any).available_tokens))) /
                      Number(item.token_supply ?? (item as any).total_tokens)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onBuy(item)}
          className="btn-primary w-full mt-auto text-sm gap-2"
        >
          <Zap className="w-4 h-4" />
          Invest via UPI / Card
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Marketplace() {
  const { user }          = useAuth();
  const { isConnected }   = useWallet();
  const [assets, setAssets]               = useState<Asset[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Modals state
  const [isCompareOpen, setIsCompareOpen]   = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isDueDiligenceOpen, setIsDueDiligenceOpen] = useState(false);
  
  const [quantity, setQuantity]           = useState<number>(10);
  const [paymentSuccess, setPaymentSuccess]     = useState<string | null>(null);

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await assetService.getMarketplaceAssets();
        setAssets(data);
      } catch (err) {
        console.error('Failed to load marketplace assets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAssets();
  }, []);

  const filteredAssets = assets.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || item.asset_type === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['all', ...Array.from(new Set(assets.map(a => a.asset_type)))];

  function handleBuy(asset: Asset) {
    setSelectedAsset(asset);
    setShowPaymentModal(true);
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon bg-indigo-500/10 border border-indigo-500/20">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="page-title">Institutional Asset Marketplace</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fractional real-world assets · Verified on Polygon Amoy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompareOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-slate-300 hover:text-white hover:border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4 text-indigo-400" /> Compare Assets
          </button>
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-slate-300 hover:text-white hover:border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Calculator className="w-4 h-4 text-emerald-400" /> Exit Simulator
          </button>
          <button
            onClick={() => setIsDueDiligenceOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-purple-400" /> AI Due Diligence
          </button>
        </div>
      </div>

      {/* ── AI Tip ── */}
      <ContextualAITip
        title="Top AI Asset Match"
        message="Based on your profile, Solar Farm Alpha 1 matches 81% confidence with low risk rating (15/100) and verified SPV title."
        actionText="View Details"
        onAction={() => setSearchTerm('Solar Farm')}
      />

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, location, or keyword…"
            className="input-field pl-10"
            id="marketplace-search"
          />
        </div>

        {/* Category select */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field sm:w-56 select"
          id="marketplace-category"
        >
          <option value="all">All Categories</option>
          {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Category Chips (quick filter) ── */}
      {!isLoading && assets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat === 'all' ? 'All Assets' : ((ASSET_TYPE_LABELS as any)[cat] ?? cat)}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <SkeletonGrid count={6} showImage />
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-7 h-7" />}
          title="No assets match your filters"
          description="Try adjusting your search term or category filter."
          action={
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="btn-ghost text-xs"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children animate-slide-up">
          {filteredAssets.map((item) => (
            <AssetCard key={item.id} item={item} onBuy={handleBuy} />
          ))}
        </div>
      )}

      {/* ── Payment Success Toast ── */}
      {paymentSuccess && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {paymentSuccess}
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && selectedAsset && (
        <PaymentModal
          assetId={selectedAsset.id}
          assetTitle={selectedAsset.title}
          tokenPrice={Number(selectedAsset.token_price)}
          quantity={quantity}
          onSuccess={(txHash) => {
            setShowPaymentModal(false);
            setSelectedAsset(null);
            setPaymentSuccess(`✅ ${quantity} tokens of ${selectedAsset?.title} minted! Tx: ${txHash?.slice(0, 12)}…`);
            setTimeout(() => setPaymentSuccess(null), 5000);
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {/* Institutional Modals */}
      <AssetComparisonModal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
      <ExitSimulatorModal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />
      <DueDiligenceReportModal isOpen={isDueDiligenceOpen} onClose={() => setIsDueDiligenceOpen(false)} />
    </div>
  );
}
