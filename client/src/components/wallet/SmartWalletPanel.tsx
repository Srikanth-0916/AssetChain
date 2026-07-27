import React, { useState } from 'react';
import { Zap, Shield, RefreshCw, ExternalLink, CheckCircle2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { smartWalletService, SmartWalletInfo } from '../../services/smartWallet.service';
import { useWallet } from '../../contexts/WalletContext';

/**
 * SmartWalletPanel — ERC-4337 Account Abstraction UI.
 * Shows users their smart wallet address, features, and guardian setup.
 */
export function SmartWalletPanel() {
  const { address, isConnected } = useWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [walletInfo, setWalletInfo] = useState<SmartWalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guardianAddress, setGuardianAddress] = useState('');

  const handleCreateSmartWallet = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const info = await smartWalletService.getSmartWalletAddress(address);
      setWalletInfo(info);
    } catch (err) {
      console.error('Smart wallet computation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) return null;

  return (
    <div className="glass-card border border-indigo-500/20 p-4 space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          Smart Wallet (ERC-4337)
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300">Account Abstraction</span>
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-slate-800">
          {!walletInfo ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Upgrade your MetaMask wallet with ERC-4337 Account Abstraction. Get gasless transactions, guardian recovery, and batch transaction support.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  { icon: '⛽', label: 'Gas Sponsorship', desc: 'Platform pays your gas fees' },
                  { icon: '🛡️', label: 'Social Recovery', desc: 'Recover via trusted guardians' },
                  { icon: '⚡', label: 'Batch Transactions', desc: 'Multiple txs in one click' },
                  { icon: '🔑', label: 'Session Keys', desc: 'Time-limited access keys' },
                ].map((f) => (
                  <div key={f.label} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-lg mb-1">{f.icon}</div>
                    <div className="text-white font-semibold">{f.label}</div>
                    <div className="text-slate-400">{f.desc}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreateSmartWallet}
                disabled={isLoading}
                className="btn-primary w-full text-xs py-2"
              >
                {isLoading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Computing Address...</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Create Smart Account</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                walletInfo.isDeployed
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {walletInfo.isDeployed ? 'Smart Account Active on Polygon Amoy' : 'Smart Account Computed (Not Yet Deployed)'}
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">EOA (MetaMask)</span>
                    <span className="font-mono text-[10px] text-slate-300">{walletInfo.eoaAddress.slice(0, 14)}...</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Smart Account</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10px] text-indigo-300">{walletInfo.smartWalletAddress.slice(0, 14)}...</span>
                      <button
                        onClick={() => handleCopy(walletInfo.smartWalletAddress)}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Network</span>
                    <span className="text-white">{walletInfo.network}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bundler</span>
                    <a href={walletInfo.bundlerUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:underline">
                      Stackup <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* Guardian Setup */}
                <div className="space-y-2">
                  <label className="text-slate-400">Guardian Wallet Address (Recovery)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guardianAddress}
                      onChange={(e) => setGuardianAddress(e.target.value)}
                      placeholder="0x..."
                      className="input-field flex-1 text-xs py-2"
                    />
                    <button
                      onClick={() => guardianAddress && alert(`Guardian ${guardianAddress.slice(0, 10)}... registered!\n(Demo: contract call would be submitted to bundler)`)}
                      className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-xl text-[11px] font-semibold hover:bg-purple-600/30 transition-all flex-shrink-0"
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-1">
                  {walletInfo.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[11px] text-slate-400">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
