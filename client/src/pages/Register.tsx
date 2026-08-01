import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { authService } from '../services/authService';
import {
  User, Mail, Lock, AlertCircle, ArrowRight, Building2, TrendingUp,
  Wallet, Zap, ShieldCheck,
} from 'lucide-react';

import { getRoleDashboardPath } from '../utils/roleUtils';

export function Register() {
  const { register, loginWithWallet, user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { connect, address, isConnected } = useWallet();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'investor' | 'asset_owner'>('investor');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletAuth, setIsWalletAuth] = useState(false);

  // ─── AUTO-REDIRECT IF ALREADY LOGGED IN ──────────────────────────────────────
  React.useEffect(() => {
    if (isAuthenticated && !isAuthLoading && user) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, user, navigate]);

  // ─── 1. REGISTER / LOGIN WITH WALLET (PRIMARY) ────────────────────────────
  const handleWalletRegister = async () => {
    setError(null);
    setIsWalletAuth(true);

    try {
      let targetAddress = address;
      if (!targetAddress || !isConnected) {
        targetAddress = await connect();
      }

      if (!targetAddress) {
        throw new Error('Please connect your Web3 wallet (MetaMask) to continue.');
      }

      const { nonce } = await authService.requestPublicWalletNonce(targetAddress);

      if (!(window as any).ethereum) {
        throw new Error('MetaMask or Web3 wallet extension not detected in browser.');
      }

      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [nonce, targetAddress],
      });

      await loginWithWallet(targetAddress, signature, role);
      navigate(getRoleDashboardPath(role));
    } catch (err: any) {
      console.error('[WalletRegister] Error:', err);
      setError(err.message || 'Wallet registration failed. Please try again.');
    } finally {
      setIsWalletAuth(false);
    }
  };

  // ─── 2. EMAIL FORM REGISTRATION ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
      });
      navigate(getRoleDashboardPath(role));
    } catch (err: any) {
      const msg = err.message || 'Failed to create account. Please check input requirements.';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Please log in.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 glass-card p-8 border border-indigo-500/20 shadow-2xl animate-fade-in">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your Account</h2>
          <p className="text-xs text-slate-400">Join the AssetChain real-world asset investment network</p>
        </div>

        {error && (
          <div className="info-panel danger text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-300 font-medium">{error}</span>
            </div>
            {error.includes('already registered') && (
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 text-xs">
                Click here to Go to Login Page →
              </Link>
            )}
          </div>
        )}

        {/* Role selector cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('investor')}
            className={`p-3 rounded-xl border text-left transition-all ${
              role === 'investor'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-400 mb-1" />
            <div className="text-xs font-bold">Investor</div>
            <div className="text-[10px] text-slate-400 leading-tight">Buy ownership tokens & earn yield</div>
          </button>

          <button
            type="button"
            onClick={() => setRole('asset_owner')}
            className={`p-3 rounded-xl border text-left transition-all ${
              role === 'asset_owner'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="text-xs font-bold">Asset Owner</div>
            <div className="text-[10px] text-slate-400 leading-tight">Tokenize physical assets for capital</div>
          </button>
        </div>

        {/* ── PRIMARY WALLET REGISTER BUTTON ── */}
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Wallet-First Registration
            </span>
            <span className="text-emerald-400 font-semibold">Zero Gas Fee</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Register instantly by signing an off-chain message with your Web3 wallet.
          </p>
          <button
            id="wallet-register-btn"
            type="button"
            onClick={handleWalletRegister}
            disabled={isWalletAuth}
            className="btn-primary w-full py-2.5 text-xs font-bold gap-2 justify-center"
          >
            {isWalletAuth ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing Off-Chain Message…
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Register with Web3 Wallet
              </>
            )}
          </button>
        </div>

        {/* ── DIVIDER ── */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-slate-800" />
          <span className="absolute bg-[#0b0f19] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Or Register with Email
          </span>
        </div>

        {/* EMAIL REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="label">Full Legal Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, 1 upper, 1 num, 1 special"
                className="input-field pl-10"
              />
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={isLoading}
            className="btn-secondary w-full py-2.5 text-xs font-semibold mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account…
              </>
            ) : (
              <>Create Account with Email <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-900">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In with Wallet
          </Link>
        </div>
      </div>
    </div>
  );
}
