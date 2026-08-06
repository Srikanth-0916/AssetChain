import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { authService } from '../services/authService';
import {
  Lock, Mail, AlertCircle, ArrowRight, Wallet,
  ShieldCheck, TrendingUp, Coins, CheckCircle2, Sparkles,
  Zap, Key, Info,
} from 'lucide-react';

import { getRoleDashboardPath } from '../utils/roleUtils';

const FEATURES = [
  { icon: <Wallet className="w-4 h-4" />,      text: 'Wallet-First Auth — Off-chain & zero gas fee' },
  { icon: <TrendingUp className="w-4 h-4" />,  text: 'Fractional real-world asset investing' },
  { icon: <ShieldCheck className="w-4 h-4" />, text: 'AI-verified assets on Polygon blockchain' },
  { icon: <Sparkles className="w-4 h-4" />,    text: 'AI Copilot for smart investment guidance' },
];

export function Login() {
  const { login, loginWithWallet, user, isAuthenticated, isLoading } = useAuth();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState<string | null>(null);
  const [isWalletAuth, setIsWalletAuth] = useState(false);
  const [isEmailAuth,  setIsEmailAuth]  = useState(false);

  const isExpired = searchParams.get('expired') === 'true';

  // ─── AUTO-REDIRECT IF ALREADY LOGGED IN ──────────────────────────────────────
  React.useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const { connect, disconnect, address, isConnected, signer } = useWallet();

  const [walletAuthStage, setWalletAuthStage] = useState<'idle' | 'connecting' | 'nonce' | 'signing' | 'verifying' | 'success'>('idle');

  // ─── 1. WALLET-FIRST AUTH (PRIMARY) ─────────────────────────────────────────
  const handleWalletAuth = async () => {
    setError(null);
    setIsWalletAuth(true);
    setWalletAuthStage('connecting');

    try {
      let targetAddress = address;
      if (!targetAddress || !isConnected) {
        targetAddress = await connect();
      }

      if (!targetAddress) {
        throw new Error('Please connect your Web3 wallet (MetaMask) to continue.');
      }

      setWalletAuthStage('nonce');
      const { nonce } = await authService.requestPublicWalletNonce(targetAddress);

      let signature = '';
      setWalletAuthStage('signing');

      // Helper to find specific MetaMask provider if multiple extensions installed
      const getEthProvider = () => {
        const winEth = (window as any).ethereum;
        if (!winEth) return null;
        if (Array.isArray(winEth.providers)) {
          return winEth.providers.find((p: any) => p.isMetaMask) || winEth.providers[0];
        }
        return winEth;
      };

      const ethProvider = getEthProvider();

      if (signer) {
        // Ethers JsonRpcSigner path
        signature = await signer.signMessage(nonce);
      } else if (ethProvider) {
        // Direct EIP-191 Personal Sign request
        signature = await ethProvider.request({
          method: 'personal_sign',
          params: [nonce, targetAddress],
        });
      } else if (targetAddress.toLowerCase() === '0x71c7656ec8ab88f190278148b1110098487a3e21') {
        // Whitelisted Sandbox / Demo Wallet mode fallback
        signature = `0x_sandbox_eip191_signature_${Date.now()}`;
      } else {
        // No Web3 wallet provider or extension detected — disconnect stale state & prompt install
        disconnect();
        throw new Error('MetaMask or a compatible Web3 wallet extension is required to sign in with a wallet. Please install MetaMask and try again.');
      }

      // Ensure signature is a clean string
      if (typeof signature !== 'string') {
        signature = String(signature);
      }
      signature = signature.trim();
      if (!signature.startsWith('0x')) {
        signature = `0x${signature}`;
      }

      console.log('[WalletAuth] Captured Signature Diagnostics:');
      console.log(' - Type:', typeof signature);
      console.log(' - Length:', signature.length, 'chars (Expected: 132 chars for 65-byte EIP-191)');
      console.log(' - Preview:', `${signature.slice(0, 10)}...${signature.slice(-10)}`);

      setWalletAuthStage('verifying');
      const loggedUser = await loginWithWallet(targetAddress, signature, 'investor');

      setWalletAuthStage('success');
      navigate(getRoleDashboardPath(loggedUser.role));
    } catch (err: any) {
      console.error('[WalletAuth] Error:', err);
      setError(err.message || 'Wallet signature verification failed. Please try again.');
      setWalletAuthStage('idle');
    } finally {
      setIsWalletAuth(false);
    }
  };

  // ─── 2. EMAIL AUTH ─────────────────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailAuth(true);
    try {
      const loggedUser = await login({ email, password });
      navigate(getRoleDashboardPath(loggedUser.role));
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsEmailAuth(false);
    }
  };


  return (
    <div className="min-h-screen flex items-stretch">

      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-emerald-500/8 blur-[80px]" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Asset<span className="text-indigo-400">Chain</span>
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-white leading-[1.15]">
              Wallet-First<br />
              <span className="gradient-text">Authentication</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Log in instantly using your Web3 wallet. Zero gas fee, off-chain EIP-191 cryptographic signatures.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  {f.icon}
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">Off-Chain Signature Only</div>
              <div className="text-slate-500 text-[11px]">No gas fees · Preserves database user identity</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-slate-600">
          © 2025 AssetChain · Secured by Polygon Blockchain
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 bg-[#030712]">
        <div className="w-full max-w-[420px] space-y-6 animate-fade-in">

          {/* Header */}
          <div className="space-y-1">
            <h1 className="page-title">Sign In</h1>
            <p className="text-sm text-slate-500">Choose your preferred sign-in method</p>
          </div>

          {/* Alerts */}
          {isExpired && (
            <div className="info-panel warning text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-amber-300">Your session has expired. Please sign in again.</span>
            </div>
          )}
          {error && (
            <div className="info-panel danger text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* ── PRIMARY WALLET LOGIN BUTTON ── */}
          <div className="space-y-3.5 p-5 rounded-2xl bg-gradient-to-b from-indigo-500/10 via-slate-900/80 to-slate-900/90 border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Recommended Web3 Auth
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Zero Gas Fee · Off-Chain
              </span>
            </div>

            {/* Explicit EIP-191 Security Notice */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-1">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                How Web3 Authentication Works
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                We use EIP-191 cryptographic signatures. <strong>No transaction will occur. No gas fee will be charged.</strong> Your wallet ownership is only being verified via an off-chain challenge.
              </p>
            </div>

            {/* Progress Stepper (Visible during Wallet Auth) */}
            {isWalletAuth && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-xs animate-fade-in">
                <div className="flex items-center justify-between font-semibold text-indigo-200 text-[11px]">
                  <span>Authentication Pipeline</span>
                  <span className="capitalize font-mono text-emerald-400 font-bold">{walletAuthStage}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center font-semibold">
                  <div className={`p-1 rounded ${walletAuthStage === 'connecting' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-900 text-slate-400'}`}>1. Connect</div>
                  <div className={`p-1 rounded ${walletAuthStage === 'nonce' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-900 text-slate-400'}`}>2. Nonce</div>
                  <div className={`p-1 rounded ${walletAuthStage === 'signing' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-900 text-slate-400'}`}>3. Sign</div>
                  <div className={`p-1 rounded ${walletAuthStage === 'verifying' || walletAuthStage === 'success' ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-900 text-slate-400'}`}>4. Verify</div>
                </div>
              </div>
            )}

            <button
              id="wallet-login-btn"
              onClick={handleWalletAuth}
              disabled={isWalletAuth}
              className="btn-primary w-full py-3 text-sm font-bold gap-2 justify-center shadow-lg shadow-indigo-600/30"
            >
              {isWalletAuth ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {walletAuthStage === 'connecting' && 'Connecting Wallet…'}
                  {walletAuthStage === 'nonce' && 'Fetching Security Nonce…'}
                  {walletAuthStage === 'signing' && 'Awaiting MetaMask Sign…'}
                  {walletAuthStage === 'verifying' && 'Verifying Signature & Issuing JWT…'}
                  {walletAuthStage === 'success' && 'Authenticated! Redirecting…'}
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Sign In with Web3 Wallet
                </>
              )}
            </button>

            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Polygon Amoy Testnet · EIP-191 Personal Sign
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-[#030712] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Or Sign In With Email
            </span>
          </div>

          {/* ── EMAIL FALLBACK FORM ── */}
          <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="label" htmlFor="login-email">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@assetchain.io"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isEmailAuth}
              className="btn-secondary w-full py-2.5 text-xs font-semibold"
            >
              {isEmailAuth ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign In with Email <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-1">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create account with wallet
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
