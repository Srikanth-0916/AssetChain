import React, { useState } from 'react';
import {
  Coins, ArrowRight, ShieldCheck, Percent, Zap, Building2,
  TrendingUp, CheckCircle2, AlertCircle, Info, RefreshCw
} from 'lucide-react';

interface CollateralAsset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  tokensOwned: number;
  tokenPrice: number;
  totalValue: number;
  maxLtvPct: number; // Max Loan to Value e.g. 70%
  apyInterest: number; // e.g. 4.2%
}

const USER_HOLDINGS: CollateralAsset[] = [
  { id: '1', name: 'Green Valley Commercial REIT', symbol: 'GVP', icon: '🏢', tokensOwned: 50, tokenPrice: 1000, totalValue: 50000, maxLtvPct: 70, apyInterest: 3.8 },
  { id: '2', name: 'AgriTech Solar Farm Alpha',    symbol: 'AGRI', icon: '☀️', tokensOwned: 25, tokenPrice: 2000, totalValue: 50000, maxLtvPct: 65, apyInterest: 4.2 },
  { id: '3', name: 'TechHub Innovation Center',   symbol: 'TCHB', icon: '🏙️', tokensOwned: 10, tokenPrice: 4200, totalValue: 42000, maxLtvPct: 75, apyInterest: 3.5 },
];

export function RWACollateralVault() {
  const [selectedAsset, setSelectedAsset] = useState<CollateralAsset>(USER_HOLDINGS[0]);
  const [depositAmount, setDepositAmount] = useState<number>(20); // 20 tokens
  const [borrowAmount, setBorrowAmount] = useState<number>(10000); // $10,000 USDC
  const [borrowSuccess, setBorrowSuccess] = useState<string | null>(null);

  const collateralValue = depositAmount * selectedAsset.tokenPrice;
  const maxBorrowLimit = collateralValue * (selectedAsset.maxLtvPct / 100);
  const currentLtv = collateralValue > 0 ? (borrowAmount / collateralValue) * 100 : 0;
  const healthFactor = currentLtv > 0 ? (selectedAsset.maxLtvPct / currentLtv).toFixed(2) : '2.50';

  const handleBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (borrowAmount > maxBorrowLimit) return;
    setBorrowSuccess(`🎉 Success! Borrowed $${borrowAmount.toLocaleString()} USDC against ${depositAmount} ${selectedAsset.symbol} tokens. Funds deposited to your Web3 wallet.`);
    setTimeout(() => setBorrowSuccess(null), 5000);
  };

  return (
    <div className="page-container animate-fade-in space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Coins className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">RWA Collateralized Lending Vault</h1>
            <p className="text-sm text-slate-400">Use your fractional real-world asset tokens as collateral to borrow stablecoins instantly</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
          <Zap className="w-3.5 h-3.5" /> Instant On-Chain Liquidity (0-Gas Fee)
        </div>
      </div>

      {/* Success Notification */}
      {borrowSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1">{borrowSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Select Asset & Deposit Controls */}
        <div className="lg:col-span-7 space-y-6">

          {/* Step 1: Select Collateral Asset */}
          <div className="stat-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
              Select Collateral Token
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {USER_HOLDINGS.map((asset) => {
                const isSelected = selectedAsset.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setDepositAmount(Math.min(20, asset.tokensOwned));
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-2xl mb-2">{asset.icon}</div>
                    <div className="font-bold text-sm text-white truncate">{asset.symbol}</div>
                    <div className="text-[11px] text-slate-400 truncate">{asset.name}</div>
                    <div className="text-xs font-mono font-semibold text-emerald-400 mt-2">
                      {asset.tokensOwned} Owned (₹{asset.tokenPrice.toLocaleString()}/ea)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Configure Deposit & Loan */}
          <form onSubmit={handleBorrow} className="stat-card p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
              Configure Collateral & Borrow Amount
            </h3>

            {/* Tokens to Lock */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Collateral Deposit ({selectedAsset.symbol})</span>
                <span className="text-slate-400">Available: {selectedAsset.tokensOwned} tokens</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="number"
                  min={1}
                  max={selectedAsset.tokensOwned}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Math.max(1, Math.min(selectedAsset.tokensOwned, Number(e.target.value))))}
                  className="bg-transparent text-lg font-bold text-white font-mono flex-1 outline-none"
                />
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {selectedAsset.symbol} Tokens
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Collateral Value: <span className="text-slate-200 font-bold font-mono">₹{collateralValue.toLocaleString()} ($${(collateralValue / 83).toFixed(2)})</span>
              </div>
            </div>

            {/* Amount to Borrow */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Borrow Stablecoins (USDC)</span>
                <span className="text-emerald-400">Max Borrow: ₹{maxBorrowLimit.toLocaleString()} ({selectedAsset.maxLtvPct}% LTV)</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="number"
                  min={100}
                  max={maxBorrowLimit}
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Number(e.target.value))}
                  className="bg-transparent text-lg font-bold text-white font-mono flex-1 outline-none"
                />
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  USDC
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={borrowAmount > maxBorrowLimit || depositAmount <= 0}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              Deposit {depositAmount} {selectedAsset.symbol} & Borrow ₹{borrowAmount.toLocaleString()} USDC <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Right Column: Health Factor & Loan Summary */}
        <div className="lg:col-span-5 space-y-6">

          <div className="stat-card p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Vault Risk & Health Summary
            </h3>

            <div className="space-y-4">

              {/* Health Factor Badge */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Vault Health Factor</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{healthFactor}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Safe (&gt;1.50 Threshold)</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              {/* Loan Parameters list */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Borrow Interest Rate (APR):</span>
                  <span className="text-white font-mono font-bold">{selectedAsset.apyInterest}% Fixed</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Max Loan-to-Value (LTV):</span>
                  <span className="text-white font-mono font-bold">{selectedAsset.maxLtvPct}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Current Borrow LTV:</span>
                  <span className={`font-mono font-bold ${currentLtv > selectedAsset.maxLtvPct ? 'text-red-400' : 'text-emerald-400'}`}>
                    {currentLtv.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Liquidation Threshold:</span>
                  <span className="text-amber-400 font-mono font-bold">85.0% LTV</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong>RWA Collateral Lock:</strong> Your tokens remain strictly locked in the smart contract vault (`TreasuryVault.sol`). Rental income dividends generated by your tokens continue to accrue to your wallet while borrowed.
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
