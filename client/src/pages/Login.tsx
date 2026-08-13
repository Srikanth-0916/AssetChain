import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { authService } from '../services/authService';
import {
  Lock, Mail, AlertCircle, ArrowRight, Wallet,
  ShieldCheck, TrendingUp, Coins, CheckCircle2, Sparkles,
  Zap, Building2, Eye, EyeOff, ExternalLink, RefreshCw,
} from 'lucide-react';
import { getRoleDashboardPath } from '../utils/roleUtils';

const BENEFITS = [
  {
    title: 'Verified Real-World Assets',
    desc: 'AES-256 encrypted title deeds & SPV legal ownership structures.',
    icon: <Building2 className="w-4 h-4 text-indigo-400" />,
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    title: 'Secure Blockchain Transactions',
    desc: 'Audited ERC-20 smart contracts & 2-of-3 multi-sig approval.',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    title: 'Transparent Investment History',
    desc: 'Immutable Polygon Amoy ledger & automated yield distributions.',
    icon: <TrendingUp className="w-4 h-4 text-purple-400" />,
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
];

export function Login() {
  const { login, loginWithWallet, user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWalletAuth, setIsWalletAuth] = useState(false);
  const [isEmailAuth, setIsEmailAuth] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const DEMO_ACCOUNTS = [
    { label: 'Investor Demo', email: 'investor@assetchain.io', password: 'Investor123!', role: 'investor', color: 'indigo' },
    { label: 'Asset Owner Demo', email: 'issuer@assetchain.io', password: 'Issuer123!', role: 'asset_owner', color: 'emerald' },
  ];

  const isExpired = searchParams.get('expired') === 'true';

  React.useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const { connect, disconnect, address, isConnected, signer, chainId, switchToPolygonAmoy, isCorrectNetwork } = useWallet();

  const [walletAuthStage, setWalletAuthStage] = useState<
    'idle' | 'connecting' | 'connected' | 'nonce' | 'signing' | 'verifying' | 'signingIn' | 'success' | 'notInstalled' | 'wrongNetwork'
  >('idle');

  // Friendly Error Mapper
  const mapWalletError = (err: any): string => {
    const msg = err?.message || String(err || '');
    const code = err?.code;

    if (msg.includes('not installed') || !window.ethereum) {
      return "MetaMask is not installed. Install MetaMask to continue.";
    }
    if (code === 4001 || msg.includes('user rejected') || msg.includes('User denied')) {
      return "Wallet connection was cancelled.";
    }
    if (msg.includes('Signature cancelled') || msg.includes('rejected signature')) {
      return "Signature cancelled. No transaction was submitted.";
    }
    if (msg.includes('Polygon Amoy') || msg.includes('wrong network')) {
      return "Please switch to Polygon Amoy Testnet.";
    }
    if (msg.includes('switch was cancelled') || msg.includes('Unrecognized chain')) {
      return "Network switch was cancelled.";
    }
    if (msg.includes('changed')) {
      return "Wallet account changed. Please authenticate again.";
    }
    if (msg.includes('expired')) {
      return "Your login request expired. Please try again.";
    }
    if (msg.includes('associated') || msg.includes('linked to another')) {
      return "This wallet is already associated with another account.";
    }
    if (msg.includes('verification failed') || msg.includes('mismatch')) {
      return "Wallet verification failed.";
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return "Unable to connect to AssetChain. Please try again.";
    }
    return msg || "Unable to connect to AssetChain. Please try again.";
  };

  // ─── 1. METAMASK WALLET LOGIN FLOW ────────────────────────────────────────
  const handleWalletAuth = async () => {
    setError(null);

    // 1. Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      setWalletAuthStage('notInstalled');
      setError("MetaMask is not installed. Install MetaMask to continue.");
      return;
    }

    setIsWalletAuth(true);
    setWalletAuthStage('connecting');

    try {
      // 2. Request Accounts (eth_requestAccounts)
      let targetAddress = address;
      if (!targetAddress || !isConnected) {
        try {
          targetAddress = await connect('MetaMask');
        } catch (connErr: any) {
          if (connErr?.code === 4001 || connErr?.message?.includes('User denied')) {
            throw new Error("Wallet connection was cancelled.");
          }
          throw connErr;
        }
      }

      if (!targetAddress) {
        throw new Error("Wallet connection was cancelled.");
      }

      setWalletAuthStage('connected');

      // 3. Verify Polygon Amoy Chain ID (80002 / 0x13882)
      if (window.ethereum) {
        const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChain = parseInt(hexChainId, 16);
        if (currentChain !== 80002) {
          setWalletAuthStage('wrongNetwork');
          try {
            await switchToPolygonAmoy();
          } catch (netErr: any) {
            throw new Error("Please switch to Polygon Amoy Testnet.");
          }
        }
      }

      // 4. Request Nonce from Backend
      setWalletAuthStage('nonce');
      const { nonce } = await authService.requestPublicWalletNonce(targetAddress);

      // 5. Request EIP-191 Personal Signature (Gasless)
      setWalletAuthStage('signing');
      let signature = '';

      const getEthProvider = () => {
        const winEth = (window as any).ethereum;
        if (!winEth) return null;
        if (Array.isArray(winEth.providers)) {
          return winEth.providers.find((p: any) => p.isMetaMask) || winEth.providers[0];
        }
        return winEth;
      };
      const ethProvider = getEthProvider();

      try {
        if (signer) {
          signature = await signer.signMessage(nonce);
        } else if (ethProvider) {
          signature = await ethProvider.request({
            method: 'personal_sign',
            params: [nonce, targetAddress],
          });
        } else {
          throw new Error("MetaMask is not installed. Install MetaMask to continue.");
        }
      } catch (signErr: any) {
        if (signErr?.code === 4001 || signErr?.message?.includes('User denied')) {
          throw new Error("Signature cancelled. No transaction was submitted.");
        }
        throw signErr;
      }

      if (typeof signature !== 'string') signature = String(signature);
      signature = signature.trim();
      if (!signature.startsWith('0x')) signature = `0x${signature}`;

      // 6. Verify Signature on Backend & Login
      setWalletAuthStage('verifying');
      setWalletAuthStage('signingIn');
      const loggedUser = await loginWithWallet(targetAddress, signature, 'investor');

      setWalletAuthStage('success');
      navigate(getRoleDashboardPath(loggedUser.role));
    } catch (err: any) {
      const friendlyMsg = mapWalletError(err);
      setError(friendlyMsg);
      if (friendlyMsg.includes('not installed')) {
        setWalletAuthStage('notInstalled');
      } else if (friendlyMsg.includes('switch to Polygon')) {
        setWalletAuthStage('wrongNetwork');
      } else {
        setWalletAuthStage('idle');
      }
    } finally {
      setIsWalletAuth(false);
    }
  };

  // ─── Network Switch Handler ───────────────────────────────────────────────
  const handleSwitchNetwork = async () => {
    setError(null);
    try {
      await switchToPolygonAmoy();
      setWalletAuthStage('idle');
    } catch (err: any) {
      setError("Network switch was cancelled.");
    }
  };

  // ─── 2. EMAIL AUTH ─────────────────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email address and password.');
      return;
    }
    setError(null);
    setIsEmailAuth(true);
    try {
      const loggedUser = await login({ email: email.trim(), password });
      navigate(getRoleDashboardPath(loggedUser.role));
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsEmailAuth(false);
    }
  };

  // ─── 3. GOOGLE AUTH ────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setError(null);
    setIsGoogleAuth(true);
    try {
      const authRes = await authService.signInWithGoogle();
      if (authRes?.token) {
        localStorage.setItem('auth_token', authRes.token);
        if (authRes.refreshToken) localStorage.setItem('refresh_token', authRes.refreshToken);
      }
      navigate(getRoleDashboardPath(authRes?.user?.role ?? 'investor'));
    } catch (err: any) {
      setError(err.message || 'Google sign-in error. Please try again.');
    } finally {
      setIsGoogleAuth(false);
    }
  };

  // ─── Demo Credential Fill ───────────────────────────────────────────────────
  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setShowDemo(false);
  };

  const walletStageLabels: Record<string, string> = {
    connecting: 'Connecting...',
    connected: 'Wallet Connected',
    nonce: 'Waiting for signature...',
    signing: 'Waiting for signature...',
    verifying: 'Verifying wallet...',
    signingIn: 'Signing you in...',
    success: 'Login successful',
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[#030712]">

      {/* ── LEFT SIDE / HERO SECTION ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950" />
        {/* Glow nodes */}
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/[0.07] blur-[130px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-500/[0.05] blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* AssetChain Branding Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-400 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Asset<span className="text-indigo-400">Chain</span>
          </span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" /> Real-World Asset (RWA) Tokenization
            </div>
            <h2 className="text-4xl font-black text-white leading-[1.15] tracking-tight">
              Invest in Real-World Assets, <span className="gradient-text">On-Chain.</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Securely access tokenized real-world assets and manage your investments with blockchain-powered ownership.
            </p>
          </div>

          {/* 3 Short Benefits */}
          <div className="grid grid-cols-1 gap-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${b.bg} border shrink-0`}>
                  {b.icon}
                </span>
                <div>
                  <div className="text-xs font-bold text-white">{b.title}</div>
                  <div className="text-[11px] text-slate-400">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Trust Strip */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] text-emerald-300">
              <strong>Gasless EIP-191 Wallet Auth</strong> — Zero gas fees · Polygon Amoy Testnet · Multi-role RBAC
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-slate-600">© 2025 AssetChain · Secured by Polygon Blockchain</div>
      </div>

      {/* ── RIGHT LOGIN CARD PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 bg-[#030712] relative">
        <div className="w-full max-w-[420px] space-y-5 animate-fade-in">

          {/* Login Card Header */}
          <div className="space-y-1 mb-2">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AssetChain</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-400">
              Sign in securely to access your AssetChain dashboard or <button onClick={() => setShowDemo(v => !v)} className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors">try a demo</button>
            </p>
          </div>

          {/* DEMO CREDENTIALS QUICK-FILL */}
          {showDemo && (
            <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-3 animate-fade-in">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Quick Demo Access — Click to Auto-Fill
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(d => (
                  <button
                    key={d.role}
                    type="button"
                    onClick={() => fillDemo(d.email, d.password)}
                    className={`p-3 rounded-xl text-left border transition-all hover:scale-[1.02] ${
                      d.color === 'indigo'
                        ? 'bg-indigo-500/10 border-indigo-500/25 hover:border-indigo-400/50'
                        : 'bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-400/50'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-0.5 ${d.color === 'indigo' ? 'text-indigo-300' : 'text-emerald-300'}`}>{d.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{d.email}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Demo accounts provide pre-seeded data for testing all platform features.</p>
            </div>
          )}

          {/* Alerts */}
          {isExpired && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── METAMASK LOGIN SECTION ── */}
          <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-b from-indigo-500/10 via-slate-900/80 to-slate-950/90 border border-indigo-500/30 shadow-xl shadow-indigo-950/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Recommended Web3 Auth
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Zero Gas · Gasless Auth
              </span>
            </div>

            {/* Connect MetaMask Prominent Button */}
            {walletAuthStage === 'notInstalled' ? (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-3 text-sm font-bold gap-2 justify-center shadow-lg shadow-indigo-600/30 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <ExternalLink className="w-4 h-4" /> Install MetaMask
              </a>
            ) : walletAuthStage === 'wrongNetwork' ? (
              <button
                type="button"
                onClick={handleSwitchNetwork}
                className="btn-primary w-full py-3 text-sm font-bold gap-2 justify-center shadow-lg shadow-amber-600/30 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
              >
                <RefreshCw className="w-4 h-4 animate-spin" /> Switch Network
              </button>
            ) : (
              <button
                id="wallet-login-btn"
                onClick={handleWalletAuth}
                disabled={isWalletAuth}
                className="btn-primary w-full py-3 text-sm font-bold gap-2 justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-60"
              >
                {isWalletAuth ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {walletStageLabels[walletAuthStage] || 'Connecting...'}
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 text-amber-400" /> Connect MetaMask
                  </>
                )}
              </button>
            )}

            {/* Live State Tracker */}
            {isWalletAuth && (
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 text-xs animate-fade-in">
                <div className="flex items-center justify-between font-semibold text-indigo-200 text-[11px]">
                  <span>Authentication Status</span>
                  <span className="font-mono text-emerald-400 font-bold">{walletStageLabels[walletAuthStage] || walletAuthStage}</span>
                </div>
              </div>
            )}

            {/* ── METAMASK 3-STEP HELP GUIDE ── */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> How to connect
              </div>
              <ol className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-400 shrink-0">1.</span>
                  <div>
                    <strong className="text-white">Connect Wallet</strong> — Click Connect Wallet and select MetaMask.
                  </div>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-400 shrink-0">2.</span>
                  <div>
                    <strong className="text-white">Select Account</strong> — Choose the wallet account you want to use.
                  </div>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-400 shrink-0">3.</span>
                  <div>
                    <strong className="text-white">Sign In</strong> — Approve the signature request in MetaMask to securely authenticate.
                  </div>
                </li>
              </ol>

              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <p className="text-[10px] text-slate-400">
                  No password or gas fee is required for authentication.
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300">
                  <span>Network: <strong>Polygon Amoy Testnet</strong></span>
                  <span>Chain ID: <strong>80002</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-[#030712] px-3 text-[10px] uppercase font-bold text-slate-600 tracking-widest">
              OR
            </span>
          </div>

          {/* ── EMAIL / PASSWORD FORM ── */}
          <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
            {/* Email */}
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
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isEmailAuth}
              className="btn-secondary w-full py-2.5 text-xs font-semibold disabled:opacity-60"
            >
              {isEmailAuth ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In with Email <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>

            {/* Google Sign-in */}
            <button
              type="button"
              id="google-login-btn"
              onClick={handleGoogleAuth}
              disabled={isGoogleAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
            >
              {isGoogleAuth ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign In with Google
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-1">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create account
            </Link>
          </p>

          {/* Trust Badges Strip */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
            {[
              { icon: <ShieldCheck className="w-3 h-3" />, label: 'AES-256 Encryption', color: 'text-emerald-400' },
              { icon: <CheckCircle2 className="w-3 h-3" />, label: 'ERC-3643 Compliant', color: 'text-indigo-400' },
              { icon: <Lock className="w-3 h-3" />, label: 'GDPR & SEC Aligned', color: 'text-purple-400' },
              { icon: <Coins className="w-3 h-3" />, label: 'Polygon Blockchain', color: 'text-amber-400' },
            ].map(({ icon, label, color }) => (
              <div key={label} className={`flex items-center gap-1.5 text-[10px] font-semibold ${color}`}>
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

