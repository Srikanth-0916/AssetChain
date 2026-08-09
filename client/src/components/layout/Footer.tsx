import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, Globe, Disc as Discord, ShieldCheck,
  CheckCircle2, FileText, Lock, Send, Award, Activity,
  HelpCircle, Building2, Check, Sparkles
} from 'lucide-react';

export function Footer() {
  const [modalType, setModalType] = useState<'kyc' | 'audit' | 'terms' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmailInput('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="relative bg-slate-950 border-t border-indigo-500/20 pt-14 pb-10 px-4 lg:px-8 text-slate-400 text-sm overflow-hidden">

      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">

        {/* ── Friendly "Why AssetChain is Safe & Trusted" Banner ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">100% Deed-Backed Assets</div>
              <div className="text-[11px] text-slate-400">Every token represents verified physical property ownership.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Smart Contract Escrow</div>
              <div className="text-[11px] text-slate-400">Your investment funds are held safely until property targets are met.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Zero Gas Fees</div>
              <div className="text-[11px] text-slate-400">Sign in &amp; manage your portfolio with zero transaction cost.</div>
            </div>
          </div>
        </div>

        {/* ── Brand & Newsletter Strip ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-slate-800/80 items-center">
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Asset<span className="text-indigo-400">Chain</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Verified Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Invest in shares of commercial real estate and real-world properties. Earn monthly rental yields and trade digital property tokens securely on Polygon.
            </p>
          </div>

          <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs font-semibold text-white mb-1.5 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-indigo-400" /> Subscribe to Property Yield &amp; Market Updates
            </div>
            {subscribed ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> You are subscribed to AssetChain market updates!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="input-field py-2 text-xs flex-1"
                  required
                />
                <button type="submit" className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Main Footer Columns (Clear & Simple Jargon-Free Titles) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Explore Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/marketplace" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                  <span>→</span> Browse Property Marketplace
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                  <span>→</span> Track My Investments
                </Link>
              </li>
              <li>
                <Link to="/ai-copilot" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                  <span>→</span> AI Investment Advisor
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                  <span>→</span> Rewards &amp; Investor Loyalty
                </Link>
              </li>
              <li>
                <Link to="/activity" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                  <span>→</span> Platform Activity Feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Safety */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Safety &amp; Legal Protection
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setModalType('kyc')} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-left">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Identity Verification &amp; Security</span>
                </button>
              </li>
              <li>
                <button onClick={() => setModalType('audit')} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-left">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Smart Contract Safety Audit</span>
                </button>
              </li>
              <li>
                <button onClick={() => setModalType('terms')} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-left">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Terms of Service &amp; Legal Guide</span>
                </button>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Investor Privacy &amp; Data Encryption</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: How Blockchain Protects You (Simplified language, no raw hexes) */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Automated Safety Systems
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { title: 'Safe Vault Escrow', desc: 'Funds stored securely until legal title checks pass.' },
                { title: 'Digital Title Deeds', desc: 'Proof of land & property ownership registered digitally.' },
                { title: 'Automated Dividend Distribution', desc: 'Rental income deposited directly to investor wallets.' },
                { title: 'Investor DAO Voting', desc: 'Vote on property upgrades and sale proposals.' },
              ].map((sys, i) => (
                <div key={i} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
                  <div className="font-bold text-white text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {sys.title}
                  </div>
                  <div className="text-[10px] text-slate-400">{sys.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Simple System Status */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> System Security Status
            </h4>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Blockchain Network:</span>
                <span className="text-emerald-400 font-bold">Polygon Amoy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Network Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 100% Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Wallet Auth Fee:</span>
                <span className="text-indigo-300 font-bold">Zero Gas (Free)</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" /> System Uptime
                </span>
                <span className="text-emerald-400 font-bold">99.9% Reliable</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Copyright & Security Footer Strip ── */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <div className="text-slate-500">
            © 2026 AssetChain Protocol. All rights reserved. Real-World Assets tokenized securely on Polygon.
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <Link to="/security" className="hover:text-white transition-colors flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Security Center
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1">
              <Globe className="w-4 h-4 text-emerald-400" /> Privacy Policy
            </Link>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
              title="AssetChain Community Discord"
            >
              <Discord className="w-4 h-4 text-purple-400" /> Community Discord
            </a>
          </div>
        </div>

      </div>

      {/* ── Interactive Legal & Compliance Modals ── */}
      {modalType === 'kyc' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setModalType(null)}
        >
          <div
            className="glass-card p-6 max-w-lg w-full border border-emerald-500/30 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Identity Verification &amp; Security Protocol</h3>
                <p className="text-xs text-slate-400">How AssetChain protects your identity and investments</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>AssetChain enforces government compliance standard identity checks before allowing property token purchases.</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Government ID &amp; Address Verification</li>
                <li>Anti-Money Laundering (AML) Screening</li>
                <li>Encrypted Investor Privacy Shield (GDPR Compliant)</li>
              </ul>
            </div>
            <button onClick={() => setModalType(null)} className="btn-primary w-full text-xs py-2">
              Got it, Close
            </button>
          </div>
        </div>
      )}

      {modalType === 'audit' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setModalType(null)}
        >
          <div
            className="glass-card p-6 max-w-lg w-full border border-indigo-500/30 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Smart Contract Security Audit</h3>
                <p className="text-xs text-slate-400">Audited code for safe investor funds</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>AssetChain smart contracts undergo independent third-party security audits to ensure zero vulnerabilities.</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Zero Critical Vulnerabilities Found</li>
                <li>ERC-3643 Permissioned Security Standard</li>
                <li>Automated Multi-Sig Escrow Locks</li>
              </ul>
            </div>
            <button onClick={() => setModalType(null)} className="btn-primary w-full text-xs py-2">
              Got it, Close
            </button>
          </div>
        </div>
      )}

      {modalType === 'terms' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setModalType(null)}
        >
          <div
            className="glass-card p-6 max-w-lg w-full border border-purple-500/30 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <FileText className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">Terms of Service &amp; Legal Protection</h3>
                <p className="text-xs text-slate-400">Legal property ownership guidelines</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fractional real estate tokens purchased on AssetChain confer legal ownership rights in the Special Purpose Vehicle (SPV) holding the physical title deed. Dividends are paid from rental yields.
            </p>
            <button onClick={() => setModalType(null)} className="btn-primary w-full text-xs py-2">
              Got it, Close
            </button>
          </div>
        </div>
      )}

    </footer>
  );
}
