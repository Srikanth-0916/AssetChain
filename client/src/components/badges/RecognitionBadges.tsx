/**
 * RecognitionBadges — Display-only recognition badges.
 *
 * Strictly non-financial & non-redeemable:
 *   - Early Investor
 *   - DAO Participant
 *   - Diversified Portfolio
 *   - Verified Investor
 *   - Blockchain Explorer
 *
 * Badges cannot be redeemed, do not grant yield, and do not affect investments.
 */

import React from 'react';
import {
  Sparkles, Vote, PieChart, ShieldCheck, Wallet, Lock, Info, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';

export interface RecognitionBadgeItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedLabel: string;
  category: string;
}

interface RecognitionBadgesProps {
  /** Optional custom holdings count/data for dynamic checking */
  holdingsCount?: number;
  uniqueSectorsCount?: number;
  hasVotedDao?: boolean;
}

export function RecognitionBadges({
  holdingsCount = 1,
  uniqueSectorsCount = 2,
  hasVotedDao = true,
}: RecognitionBadgesProps) {
  const { user } = useAuth();
  const { isConnected, address } = useWallet();

  const isKycVerified = user?.kyc_status === 'approved';
  const isWalletLinked = isConnected || !!user?.wallet_address || !!address;
  const isEarlyMember = !!user; // Registered member

  // ── 5 Recognition-Only Badges ─────────────────────────────────────────────
  const badges: RecognitionBadgeItem[] = [
    {
      id: 'early_investor',
      name: 'Early Investor',
      description: 'Recognition for joining the platform in its early tokenization phase.',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      unlocked: isEarlyMember,
      unlockedLabel: 'Early Member',
      category: 'Platform Recognition',
    },
    {
      id: 'dao_participant',
      name: 'DAO Participant',
      description: 'Recognition for actively voting in decentralized governance proposals.',
      icon: <Vote className="w-5 h-5 text-purple-400" />,
      unlocked: hasVotedDao || user?.role === 'admin' || user?.role === 'asset_owner',
      unlockedLabel: 'Governance Member',
      category: 'Governance Recognition',
    },
    {
      id: 'diversified_portfolio',
      name: 'Diversified Portfolio',
      description: 'Recognition for spreading holdings across multiple distinct asset sectors.',
      icon: <PieChart className="w-5 h-5 text-indigo-400" />,
      unlocked: uniqueSectorsCount >= 2,
      unlockedLabel: 'Multi-Sector Portfolio',
      category: 'Portfolio Milestone',
    },
    {
      id: 'verified_investor',
      name: 'Verified Investor',
      description: 'Recognition for passing ERC-3643 regulatory identity & KYC checks.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      unlocked: isKycVerified,
      unlockedLabel: 'Identity Verified',
      category: 'Compliance Honor',
    },
    {
      id: 'blockchain_explorer',
      name: 'Blockchain Explorer',
      description: 'Recognition for connecting a Web3 wallet to Polygon Amoy Testnet.',
      icon: <Wallet className="w-5 h-5 text-cyan-400" />,
      unlocked: isWalletLinked,
      unlockedLabel: 'Web3 Connected',
      category: 'On-Chain Activity',
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="glass-card p-6 space-y-6 animate-fade-in">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Recognition Badges</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
              Non-Financial Honor Badges
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Symbolic status badges for platform milestones · Cannot be redeemed for cash or yield
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Unlocked:</span>
          <span className="font-bold text-emerald-400">{unlockedCount} / {badges.length}</span>
        </div>
      </div>

      {/* Grid of 5 Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
              badge.unlocked
                ? 'bg-slate-900/70 border-indigo-500/30 hover:border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                : 'bg-slate-950/30 border-white/[0.05] opacity-50'
            }`}
          >
            {/* Background glow */}
            {badge.unlocked && (
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
            )}

            {/* Badge Icon Header */}
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                badge.unlocked
                  ? 'bg-slate-800/80 border-indigo-500/30'
                  : 'bg-slate-900/50 border-slate-800'
              }`}>
                {badge.icon}
              </div>

              {badge.unlocked ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Unlocked
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-[10px] font-semibold">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h4 className={`text-xs font-bold ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>
                {badge.name}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {badge.description}
              </p>
            </div>

            {/* Footer Badge Tag */}
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
              <span className="text-slate-500">{badge.category}</span>
              <span className="text-slate-600 font-mono">Recognition Only</span>
            </div>
          </div>
        ))}
      </div>

      {/* Non-financial disclaimer */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-500 flex items-center gap-2">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span>
          <strong>Notice:</strong> Recognition badges are purely cosmetic achievements representing investor participation milestones. Badges cannot be redeemed, traded, or converted into financial incentives, points, or extra yield.
        </span>
      </div>
    </div>
  );
}
