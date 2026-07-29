import React, { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';
import { marketplaceService } from '../services/marketplaceService';
import type { Asset } from '../types/asset';
import { ASSET_TYPE_LABELS } from '../types/asset';
import { Coins, Search, Filter, AlertCircle, CheckCircle2, ShoppingBag, X, Zap } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { PaymentModal } from '../components/payment/PaymentModal';
import { WhyPanel } from '../components/trust/WhyPanel';
import { TrustScoreBadges } from '../components/trust/TrustScoreBadges';
import { ContextualAITip } from '../components/trust/ContextualAITip';

export function Marketplace() {
  const { isAuthenticated } = useAuth();
  const { isConnected, connect } = useWallet();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tokenized Asset Marketplace</h1>
          <p className="text-xs text-slate-400">Discover and invest in fractional real-world assets verified on Polygon</p>
        </div>
      </div>

      {/* Contextual AI Tip */}
      <ContextualAITip
        title="Top AI Asset Match"
        message="Based on your profile, Solar Farm Alpha 1 matches 81% confidence with low risk rating (15/100) and verified SPV title."
        actionText="View Details"
        onAction={() => setSearchTerm('Solar Farm')}
      />

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by asset title, location, or keyword..."
            className="input-field pl-10"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field bg-slate-900 text-white sm:w-64"
        >
          <option value="all">All Asset Categories</option>
          {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading marketplace assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16 p-8 glass-card border border-slate-800 space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-white">No assets match your search criteria</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAssets.map((item) => (
            <div key={item.id} className="glass-card-hover overflow-hidden flex flex-col">
              <div className="h-44 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 to-slate-900 flex items-center justify-center p-6 text-center">
                  <span className="text-slate-300 font-bold text-lg leading-tight">{item.title}</span>
                </div>
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-indigo-300 border border-indigo-500/20">
                  {ASSET_TYPE_LABELS[item.asset_type] || item.asset_type}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{item.title}</h3>
                      <p className="text-xs text-slate-400">{item.location || 'Global Location'}</p>
                    </div>
                    <WhyPanel
                      title="Why this rating?"
                      factors={[
                        { label: 'Low Fraud Risk', value: '15/100', status: 'positive', explanation: 'Clean AI fraud analysis & verified document history' },
                        { label: 'Token Liquidity', value: '85/100', status: 'positive', explanation: 'High trading liquidity on secondary marketplace' },
                        { label: 'Occupancy Rate', value: '100%', status: 'positive', explanation: 'Full occupancy yielding stable quarterly rental returns' },
                      ]}
                    />
                  </div>

                  {/* Trust Score Badges */}
                  <TrustScoreBadges activeBadges={['legal', 'spv', 'multisig', 'blockchain']} />
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Valuation</span>
                    <span className="font-semibold text-white">{formatCurrency(Number(item.valuation))}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Token Price</span>
                    <span className="font-semibold text-emerald-400">${item.token_price} / token</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAsset(item);
                      setShowPaymentModal(true);
                    }}
                    className="btn-primary flex-1 text-xs"
                  >
                    <Zap className="w-3.5 h-3.5" /> Buy via UPI/Card
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Success Toast */}
      {paymentSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {paymentSuccess}
        </div>
      )}

      {/* Razorpay Payment Modal */}
      {showPaymentModal && selectedAsset && (
        <PaymentModal
          assetId={selectedAsset.id}
          assetTitle={selectedAsset.title}
          tokenPrice={Number(selectedAsset.token_price)}
          quantity={quantity}
          onSuccess={(txHash) => {
            setShowPaymentModal(false);
            setSelectedAsset(null);
            setPaymentSuccess(`✅ ${quantity} tokens of ${selectedAsset?.title} minted! Tx: ${txHash?.slice(0, 12)}...`);
            setTimeout(() => setPaymentSuccess(null), 5000);
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}
