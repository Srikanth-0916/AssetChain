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

const FEATURES = [
  { icon: <Wallet className="w-4 h-4" />,      text: 'Wallet-First Auth — Off-chain & zero gas fee' },
  { icon: <TrendingUp className="w-4 h-4" />,  text: 'Fractional real-world asset investing' },
  { icon: <ShieldCheck className="w-4 h-4" />, text: 'AI-verified assets on Polygon blockchain' },
  { icon: <Sparkles className="w-4 h-4" />,    text: 'AI Copilot for smart investment guidance' },
];

export function Login() {
  const { login, loginWithWallet } = useAuth();
  const { connect, address, isConnected } = useWallet();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState<string | null>(null);
  const [isWalletAuth, setIsWalletAuth] = useState(false);
  const [isEmailAuth,  setIsEmailAuth]  = useState(false);

  const isExpired = searchParams.get('expired') === 'true';

  // ─── 1. WALLET-FIRST AUTH (PRIMARY) ─────────────────────────────────────────
  const handleWalletAuth = async () => {
    setError(null);
    setIsWalletAuth(true);

    try {
      // 1. Connect wallet if not already connected
      let targetAddress = address;
      if (!targetAddress || !isConnected) {
        targetAddress = await connect();
      }

      if (!targetAddress) {
        throw new Error('Please connect your Web3 wallet (MetaMask) to continue.');
      }

      // 2. Request public nonce from server (unauthenticated)
      const { nonce } = await authService.requestPublicWalletNonce(targetAddress);

      // 3. Request EIP-191 off-chain personal signature (0 gas fee!)
      if (!(window as any).ethereum) {
        throw new Error('MetaMask or Web3 wallet extension not detected in browser.');
      }

      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [nonce, targetAddress],
      });

      // 4. Verify signature & login/register user (user_id primary key preserved)
      await loginWithWallet(targetAddress, signature, 'investor');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[WalletAuth] Error:', err);
      setError(err.message || 'Wallet signature verification failed. Please try again.');
    } finally {
      setIsWalletAuth(false);
    }
  };

  // ─── 2. DEMO / EMAIL FALLBACK AUTH ─────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailAuth(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsEmailAuth(false);
    }
  };

  // Demo fill helper
  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
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
          <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-b from-indigo-500/10 to-slate-900/60 border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Recommended
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                Zero Gas Fee
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with your Web3 wallet via off-chain cryptographic signature.
            </p>

            <button
              id="wallet-login-btn"
              onClick={handleWalletAuth}
              disabled={isWalletAuth}
              className="btn-primary w-full py-3 text-sm font-bold gap-2 justify-center"
            >
              {isWalletAuth ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Signature…
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
              EIP-191 Personal Sign · Primary user_id preserved
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-[#030712] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Or Fallback / Demo Sign In
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

          {/* Quick Demo Fill Buttons */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              Quick Demo Accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('investor@assetchain.io', 'Investor@123')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors text-center"
              >
                Investor
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('owner@assetchain.io', 'Owner@123')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors text-center"
              >
                Asset Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@assetchain.io', 'Admin@123')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors text-center"
              >
                Admin
              </button>
            </div>
          </div>

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
