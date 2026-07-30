import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, Globe, Disc as Discord, ExternalLink, ShieldCheck,
  CheckCircle2, FileText, Lock, Copy, Check, Send, Award, Activity
} from 'lucide-react';

export function Footer() {
  const [modalType, setModalType] = useState<'kyc' | 'audit' | 'terms' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmailInput('');
      setSubscribed(false);
    }, 4000);
  };

  const handleCopyContract = (address: string, name: string) => {
    navigator.clipboard.writeText(address);
    setCopiedContract(name);
    setTimeout(() => setCopiedContract(null), 2500);
  };

  const CONTRACTS = [
    { name: 'Marketplace Contract', address: '0x72a5C1d07c089D1C90e0e0aF42dB3A7E303A4e99' },
    { name: 'Treasury Vault',       address: '0x81b7eF29eD722F0e4d7a8C4C61706a12B4711867' },
    { name: 'DAO Governance',       address: '0x45f42c3C886B8C24F0e227092305590918c5e622' },
    { name: 'Asset Registry',       address: '0x3aB481023cC82A7D2C04e8bC87332cEDa86c6a4F' },
  ];

  return (
    <footer className="relative bg-slate-950 border-t border-indigo-500/20 pt-16 pb-12 px-4 lg:px-8 text-slate-400 text-sm overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">

        {/* ── Top Section: Brand & Newsletter ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80 items-center">
          
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Asset<span className="text-indigo-400">Chain</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Institutional-grade Real-World Asset (RWA) tokenization ecosystem. Powered by Polygon Amoy blockchain, smart contract automation, and ERC-3643 compliance protocols.
            </p>
          </div>

          {/* Newsletter Input */}
          <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs font-semibold text-white mb-1.5 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-indigo-400" /> Subscribe to RWA Yield & Market Reports
            </div>
            {subscribed ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> You are subscribed to AssetChain market updates!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter institutional or personal email..."
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

        {/* ── Main Footer Columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: Platform Links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Platform Services
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/marketplace" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span> Tokenized Marketplace
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span> Investor Portfolio
                </Link>
              </li>
              <li>
                <Link to="/ai-copilot" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span> AI Investment Copilot
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span> Rewards & Staking
                </Link>
              </li>
              <li>
                <Link to="/activity" className="hover:text-indigo-300 transition-colors flex items-center gap-1.5 group">
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span> Governance & Audit Trail
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Compliance Modals */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Compliance & Trust
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => setModalType('kyc')} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-left group">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>KYC/AML & Identity Standard</span>
                </button>
              </li>
              <li>
                <button onClick={() => setModalType('audit')} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-left group">
                  <Award className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Smart Contract Security Audit</span>
                </button>
              </li>
              <li>
                <button onClick={() => setModalType('terms')} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-left group">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Terms of Service & Disclaimer</span>
                </button>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Privacy & Encryption Center</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: On-Chain Contracts with 1-Click Copy */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Smart Contracts
            </h4>
            <div className="space-y-2">
              {CONTRACTS.map((contract) => (
                <div
                  key={contract.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[11px] font-semibold text-slate-200">{contract.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {contract.address.slice(0, 8)}...{contract.address.slice(-6)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyContract(contract.address, contract.name)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Copy contract address"
                    >
                      {copiedContract === contract.name ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`https://amoy.polygonscan.com/address/${contract.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-md text-indigo-400 hover:text-indigo-300 hover:bg-white/10 transition-colors"
                      title="View on Polygonscan Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Network & Live Health Status */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Network Status
            </h4>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Chain Network:</span>
                <a
                  href="https://amoy.polygonscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-semibold font-mono hover:underline flex items-center gap-1"
                >
                  Polygon Amoy <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Chain ID:</span>
                <span className="text-indigo-300 font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  80002
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Consensus:</span>
                <span className="text-slate-300 font-medium">PoS (Zero-Gas Dev)</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" /> System Uptime
                </span>
                <span className="text-emerald-400 font-bold">99.9% Online</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom Copyright Bar ── */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span>© 2026 AssetChain Protocol. All rights reserved.</span>
            {copiedContract && (
              <span className="text-emerald-400 font-medium animate-fade-in ml-2">
                ✓ Copied address for {copiedContract}!
              </span>
            )}
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <Link to="/security" className="hover:text-white transition-colors flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Security Center
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1">
              <Globe className="w-4 h-4 text-emerald-400" /> Global Privacy
            </Link>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
              title="AssetChain Community Discord"
            >
              <Discord className="w-4 h-4 text-purple-400" /> Discord
            </a>
          </div>
        </div>

      </div>

      {/* ── Interactive Legal & Compliance Modals ── */}

      {/* 1. KYC/AML Modal */}
      {modalType === 'kyc' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModalType(null)}
        >
          <div
            className="glass-card p-8 max-w-lg w-full animate-fade-scale border border-emerald-500/30 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">KYC/AML & Identity Protocol</h3>
                <p className="text-xs text-slate-400">ERC-3643 Compliant Token Transfer Safeguards</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                AssetChain enforces <strong>ERC-3643 permissioned token standards</strong> across all tokenized real-world assets. Only verified identity profiles are authorized to execute on-chain transfers.
              </p>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white">Verification Steps:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Government-issued ID verification (Passport / National ID)</li>
                  <li>Sanctions & PEP (Politically Exposed Persons) automated screening</li>
                  <li>AES-256 encrypted nominee & beneficiary registry</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModalType(null)} className="btn-primary text-xs py-2 px-5">
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Audit Modal */}
      {modalType === 'audit' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModalType(null)}
        >
          <div
            className="glass-card p-8 max-w-lg w-full animate-fade-scale border border-amber-500/30 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Smart Contract Security Audit</h3>
                <p className="text-xs text-slate-400">Verified On-Chain Security Score: 98/100</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-black text-emerald-400">0</div>
                  <div className="text-[11px] text-slate-400">Critical Vulnerabilities</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-black text-amber-400">98/100</div>
                  <div className="text-[11px] text-slate-400">Security Score</div>
                </div>
              </div>

              <p className="text-slate-400">
                All AssetChain smart contracts (`AssetToken`, `Marketplace`, `TreasuryVault`, `DAOGovernance`) have undergone rigorous static analysis, formal verification, and reentrancy testing.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModalType(null)} className="btn-primary text-xs py-2 px-5">
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Terms Modal */}
      {modalType === 'terms' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModalType(null)}
        >
          <div
            className="glass-card p-8 max-w-lg w-full animate-fade-scale border border-indigo-500/30 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Terms of Service & Disclaimer</h3>
                <p className="text-xs text-slate-400">RWA Tokenization Legal Framework</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-2">
              <p>
                AssetChain tokens represent fractional legal ownership held via Special Purpose Vehicles (SPVs).
              </p>
              <p>
                1. Token holdings grant proportional entitlement to yield distributions generated by underlying real-world assets.
              </p>
              <p>
                2. On-chain governance votes executed via DAO proposals are legally binding under SPV operating agreements.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModalType(null)} className="btn-primary text-xs py-2 px-5">
                I Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}
