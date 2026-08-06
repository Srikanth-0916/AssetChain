import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import {
  Wallet, Shield, CheckCircle2, AlertTriangle, ExternalLink,
  X, RefreshCw, Layers, Copy, Check, ArrowRight
} from 'lucide-react';
import { truncateAddress } from '../../lib/utils';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface WalletOption {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  badge?: string;
  isPopular?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [

  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Primary web3 wallet extension & mobile app',
    iconUrl: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
    isPopular: true,
    badge: 'Recommended',
  },
  {
    id: 'demo',
    name: 'Quick Demo Account',
    description: 'Whitelisted Polygon Amoy testnet sandbox account (No extension needed)',
    iconUrl: 'https://raw.githubusercontent.com/polygontechnology/brand-resources/master/amoy-logo.svg',
    badge: 'Sandbox Mode',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Self-custody Web3 wallet by Coinbase',
    iconUrl: 'https://avatars.githubusercontent.com/u/18060234',
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    description: 'Game-changing Web3 wallet for multi-chain',
    iconUrl: 'https://rabby.io/static/media/logo.8d2b2713.svg',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    description: 'Official crypto wallet of Binance',
    iconUrl: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Fun, simple & secure Ethereum wallet',
    iconUrl: 'https://rainbow.me/assets/rainbow-logo.png',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect v2',
    description: 'Scan QR with 300+ Web3 mobile wallets',
    iconUrl: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(SVG)/walletconnect-logo-blue.svg',
    badge: 'v2 Protocol',
  },
];


export function WalletConnectModal({ isOpen, onClose, onSuccess }: WalletConnectModalProps) {
  const {
    address, isConnected, isConnecting, connect, disconnect,
    chainId, isCorrectNetwork, switchToPolygonAmoy, balance
  } = useWallet();
  const { loginWithWallet } = useAuth();

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // FIX: React preserves state when the modal returns null (isOpen=false).
  // Without this reset, a stale errorMessage from a previous session causes
  // the "Wallet Extension Not Detected" banner to appear immediately on reopen.
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSelectedWallet(null);
      setIsAuthenticating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const [authStep, setAuthStep] = useState<'idle' | 'connecting' | 'nonce' | 'signing' | 'verifying' | 'success'>('idle');

  const handleSelectWallet = async (walletId: string) => {
    setSelectedWallet(walletId);
    setIsAuthenticating(true);
    setErrorMessage(null);
    setAuthStep('connecting');

    try {
      // 1. Connect wallet extension & switch chain to Polygon Amoy (80002)
      const userAddress = await connect(walletId);
      if (!isCorrectNetwork) {
        await switchToPolygonAmoy();
      }

      // 2. EIP-191 Cryptographic Authentication Sequence
      if (walletId !== 'demo' && typeof (window as any).ethereum !== 'undefined') {
        setAuthStep('nonce');
        // Fetch server single-use nonce
        const { nonce } = await authService.requestPublicWalletNonce(userAddress);

        setAuthStep('signing');
        // Trigger MetaMask personal_sign popup window
        const signature = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [nonce, userAddress],
        });

        setAuthStep('verifying');
        // Verify signature on backend via ethers.verifyMessage(), store JWT, and update profile
        await loginWithWallet(userAddress, signature, 'investor');
      } else {
        // Fallback for Sandbox Quick Demo / Extension-absent connection
        setAuthStep('verifying');
        const demoSignature = `demo_sig_${Date.now()}_${userAddress.substring(0, 8)}`;
        await loginWithWallet(userAddress, demoSignature, 'investor');
      }

      setAuthStep('success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('[WalletConnectModal] Connection or signature error:', err);
      setErrorMessage(err.message || 'Failed to complete wallet signature authentication.');
      setAuthStep('idle');
    } finally {
      setIsAuthenticating(false);
    }
  };



  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-card border border-indigo-500/20 shadow-2xl rounded-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Connect Web3 Wallet
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  EIP-191 Protected
                </span>
              </h3>
              <p className="text-xs text-slate-400">Institutional Polygon Amoy (80002) Multi-Wallet Layer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-white">Wallet Extension Not Detected</div>
                <div>{errorMessage}</div>
              </div>
            </div>
            <button
              onClick={() => handleSelectWallet('demo')}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Connect Whitelisted Polygon Amoy Sandbox Account
            </button>
          </div>
        )}


        {/* Connected State View */}
        {isConnected ? (

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-300">Connected Wallet Active</span>
                </div>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy EOA'}
                </button>
              </div>

              <div className="font-mono text-sm font-bold text-white break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {address}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Network</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                    {isCorrectNetwork ? 'Polygon Amoy (80002)' : `Chain ID: ${chainId}`}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">POL Gas Balance</span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block">
                    {balance ? `${parseFloat(balance).toFixed(4)} POL` : '0.2500 POL'}
                  </span>
                </div>

              </div>

              {!isCorrectNetwork && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Please switch to Polygon Amoy Testnet (Chain 80002)</span>
                  </div>
                  <button
                    onClick={switchToPolygonAmoy}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold rounded-md transition-all shrink-0"
                  >
                    Switch Chain
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`https://amoy.polygonscan.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View on PolygonScan <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => { disconnect(); }}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-xs font-semibold transition-all"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Wallet Selection Options */
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Select your preferred Web3 provider to authenticate on-chain transactions:
            </p>

            <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {WALLET_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWallet(w.id)}
                  disabled={isConnecting || isAuthenticating}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-950/30 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <img src={w.iconUrl} alt={w.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {w.name}
                        {w.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                            {w.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[260px]">{w.description}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Private Key Risk</strong>: AssetChain never requests or stores private keys. Authentication uses EIP-191 single-use nonces with server-side signature validation.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
