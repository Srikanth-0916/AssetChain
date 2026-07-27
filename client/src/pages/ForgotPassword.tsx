import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 glass-card p-8 border border-indigo-500/20 shadow-2xl">
        <div className="space-y-1">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400">Enter your email address to receive password reset instructions</p>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-sm font-semibold"
          >
            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
