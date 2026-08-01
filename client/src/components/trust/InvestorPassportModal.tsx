import React from 'react';
import { X, ShieldCheck, UserCheck, Award, Star, Vote, CheckCircle2, Lock, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface InvestorPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvestorPassportModal({ isOpen, onClose }: InvestorPassportModalProps) {
  const { user } = useAuth();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-6 animate-slide-up relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Institutional Investor Passport</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white">✕</button>
        </div>

        {/* Passport Card Visual */}
        <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-950/60 to-slate-950 border border-indigo-500/40 shadow-xl space-y-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <span className="pill-badge pill-success text-[10px]">VERIFIED INSTITUTIONAL PASSPORT</span>
              <h3 className="text-xl font-bold text-white mt-1">{user?.full_name || 'Accredited Investor'}</h3>
              <div className="text-xs text-indigo-300 font-mono mt-0.5">ID: PASSPORT-INV-8849-01</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Trust Score</div>
              <div className="text-base font-bold text-emerald-400">94 / 100</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">KYC & AML</div>
              <div className="text-base font-bold text-white">Whitelisted</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Voting Power</div>
              <div className="text-base font-bold text-indigo-300">5,500 DAO</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Reputation</div>
              <div className="text-base font-bold text-amber-400">Gold Investor</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
            <span>ERC-3643 Polygon Amoy Whitelist Status:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE & CLEARED
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-primary text-xs py-2 px-5">
            Export Investor Passport (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
