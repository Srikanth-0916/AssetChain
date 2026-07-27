import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, AlertCircle, ArrowRight, Building2, TrendingUp } from 'lucide-react';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'investor' | 'asset_owner'>('investor');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please check input requirements.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 glass-card p-8 border border-indigo-500/20 shadow-2xl">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your Account</h2>
          <p className="text-xs text-slate-400">Join the AssetChain real-world asset investment network</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-sm font-semibold mt-2"
          >
            {isLoading ? 'Creating Account...' : 'Register'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-900">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
