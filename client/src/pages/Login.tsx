import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { authService } from '../services/authService';
import {
  Lock, Mail, AlertCircle, ArrowRight, Wallet,
  ShieldCheck, TrendingUp, Coins, CheckCircle2, Sparkles,
  Zap, Building2, Users, Eye, EyeOff,
} from 'lucide-react';
import { getRoleDashboardPath } from '../utils/roleUtils';

const PILLARS = [
  {
    icon: <Zap className="w-4 h-4" />,
    title: 'Zero-Gas Web3 Auth',
    desc: 'EIP-191 off-chain wallet signature. No gas fee, ever.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: <Building2 className="w-4 h-4" />,
    title: 'Fractional RWA Investing',
    desc: 'Own shares of tokenized real estate, agriculture & energy.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    title: 'ERC-3643 Legal Compliance',
    desc: 'Institutional-grade KYC, AML & whitelist transfer controls.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    title: 'Gemini AI Copilot',
    desc: 'AI-driven portfolio guidance, risk scoring & yield predictions.',
    color: 'text-purple-400',
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

  const { connect, disconnect, address, isConnected, signer } = useWallet();

  const [walletAuthStage, setWalletAuthStage] = useState<'idle' | 'connecting' | 'nonce' | 'signing' | 'verifying' | 'success'>('idle');

  // ─── 1. WALLET AUTH ────────────────────────────────────────────────────────
  const handleWalletAuth = async () => {
    setError(null);
    setIsWalletAuth(true);
    setWalletAuthStage('connecting');
    try {
      let targetAddress = address;
      if (!targetAddress || !isConnected) {
        targetAddress = await connect();
      }
      if (!targetAddress) throw new Error('Please connect your Web3 wallet (MetaMask) to continue.');

      setWalletAuthStage('nonce');
      const { nonce } = await authService.requestPublicWalletNonce(targetAddress);

      let signature = '';
      setWalletAuthStage('signing');

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
        signature = await signer.signMessage(nonce);
      } else if (ethProvider) {
        signature = await ethProvider.request({ method: 'personal_sign', params: [nonce, targetAddress] });
      } else if (targetAddress.toLowerCase() === '0x71c7656ec8ab88f190278148b1110098487a3e21') {
        signature = `0x_sandbox_eip191_signature_${Date.now()}`;
      } else {
        disconnect();
        throw new Error('MetaMask or a compatible Web3 wallet is required. Please install MetaMask and try again.');
      }

      if (typeof signature !== 'string') signature = String(signature);
      signature = signature.trim();
      if (!signature.startsWith('0x')) signature = `0x${signature}`;

      setWalletAuthStage('verifying');
      const loggedUser = await loginWithWallet(targetAddress, signature, 'investor');
      setWalletAuthStage('success');
      navigate(getRoleDashboardPath(loggedUser.role));
    } catch (err: any) {
      setError(err.message || 'Wallet signature verification failed.');
      setWalletAuthStage('idle');
    } finally {
      setIsWalletAuth(false);
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
  // signInWithGoogle() now handles the full login internally (no double-login)
  const handleGoogleAuth = async () => {
    setError(null);
    setIsGoogleAuth(true);
    try {
      const authRes = await authService.signInWithGoogle();
      // Store token and navigate
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
    connecting: 'Connecting Wallet…',
    nonce: 'Fetching Security Nonce…',
    signing: 'Awaiting MetaMask Sign…',
    verifying: 'Verifying Signature…',
    success: 'Authenticated! Redirecting…',
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[#030712]">

      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950" />
        {/* Glow nodes */}
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/[0.07] blur-[130px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-500/[0.05] blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-400 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Asset<span className="text-indigo-400">Chain</span>
          </span>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" /> Real-World Asset (RWA) Tokenization
            </div>
            <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight">
              AI-Powered Web3<br />
              <span className="gradient-text">Asset Tokenization</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              <strong>AssetChain</strong> is Polygon's leading platform for fractional Real-World Asset investing — combining zero-gas wallet auth, ERC-3643 compliance, AES-256 encrypted deeds, and Gemini AI portfolio intelligence.
            </p>
          </div>

          {/* Platform pillars */}
          <div className="grid grid-cols-1 gap-3">
            {PILLARS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${p.bg} border ${p.color} flex-shrink-0`}>
                  {p.icon}
                </span>
                <div>
                  <div className={`text-xs font-bold ${p.color}`}>{p.title}</div>
                  <div className="text-[11px] text-slate-400">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom trust strip */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] text-emerald-300">
              <strong>Zero-Gas EIP-191 Wallet Auth</strong> — Instant off-chain signature · No gas fee · Multi-role RBAC
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-slate-600">© 2025 AssetChain · Secured by Polygon Blockchain</div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 bg-[#030712] relative">
        <div className="w-full max-w-[420px] space-y-5 animate-fade-in">

          {/* Header */}
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl font-black text-white tracking-tight">Sign In</h1>
            <p className="text-sm text-slate-500">Access your AssetChain account or <button onClick={() => setShowDemo(v => !v)} className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors">try a demo</button></p>
          </div>

          {/* ── DEMO CREDENTIALS QUICK-FILL ── */}
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
              <p className="text-[10px] text-slate-500">Demo accounts have pre-seeded data for testing all platform features.</p>
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

          {/* ── WEB3 WALLET PRIMARY BUTTON ── */}
          <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-b from-indigo-500/10 via-slate-900/80 to-slate-950/90 border border-indigo-500/30 shadow-xl shadow-indigo-950/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Recommended Web3 Auth
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Zero Gas · Off-Chain
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> How to Connect with MetaMask
              </div>
              <ol className="space-y-1 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-400">1.</span>
                  <span><strong>Click Connect Wallet</strong> — Select <strong>MetaMask</strong> from the provider prompt.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-400">2.</span>
                  <span><strong>Approve Account</strong> — Choose your Web3 address in the MetaMask popup.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-400">3.</span>
                  <span><strong>Sign & Authenticate</strong> — Confirm the free EIP-191 signature prompt to sign in.</span>
                </li>
              </ol>
            </div>

            {isWalletAuth && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-xs animate-fade-in">
                <div className="flex items-center justify-between font-semibold text-indigo-200 text-[11px]">
                  <span>Authentication Pipeline</span>
                  <span className="capitalize font-mono text-emerald-400 font-bold">{walletAuthStage}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center font-semibold">
                  {(['connecting', 'nonce', 'signing', 'verifying'] as const).map((stage, i) => (
                    <div key={stage} className={`p-1 rounded transition-all ${walletAuthStage === stage ? 'bg-indigo-600 text-white animate-pulse' : walletAuthStage === 'success' && i < 4 ? 'bg-emerald-700 text-white' : 'bg-slate-900 text-slate-500'}`}>
                      {i + 1}. {['Connect', 'Nonce', 'Sign', 'Verify'][i]}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              id="wallet-login-btn"
              onClick={handleWalletAuth}
              disabled={isWalletAuth}
              className="btn-primary w-full py-3 text-sm font-bold gap-2 justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-60"
            >
              {isWalletAuth ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {walletStageLabels[walletAuthStage] || 'Connecting…'}
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" /> Sign In with Web3 Wallet
                </>
              )}
            </button>

            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Polygon Amoy Testnet · EIP-191 Personal Sign
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-[#030712] px-3 text-[10px] uppercase font-bold text-slate-600 tracking-widest">
              Or sign in with email
            </span>
          </div>

          {/* ── EMAIL FORM ── */}
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
                  Signing in…
                </>
              ) : (
                <>Sign In with Email <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>

            {/* ── GOOGLE SIGN-IN ── */}
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
                  Connecting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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

          {/* ── TRUST BADGE STRIP ── */}
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
