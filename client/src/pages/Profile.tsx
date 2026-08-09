import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import {
  User, Wallet, ShieldCheck, Upload, AlertCircle, CheckCircle2,
  Users, FileCheck, Globe, Scale, Star, Trophy, Activity,
  TrendingUp, BarChart3, Vote, Shield, Settings, Lock, Bell,
  ChevronRight, Edit3
} from 'lucide-react';
import { truncateAddress } from '../lib/utils';
import { authService } from '../services/authService';
import { SmartWalletPanel } from '../components/wallet/SmartWalletPanel';
import { RecognitionBadges } from '../components/badges/RecognitionBadges';

type ProfileTab = 'overview' | 'kyc' | 'security' | 'preferences';

const KYC_STATUS_CONFIG: Record<string, { color: string; badge: string; label: string }> = {
  approved:      { color: 'text-emerald-400', badge: 'pill-success', label: 'Verified ✓' },
  pending:       { color: 'text-amber-400',   badge: 'pill-warning', label: 'Under Review' },
  not_submitted: { color: 'text-slate-400',   badge: 'pill-neutral', label: 'Not Submitted' },
  rejected:      { color: 'text-red-400',     badge: 'pill-danger',  label: 'Rejected' },
};

export function Profile() {
  const { user, updateUser } = useAuth();
  const { address, isConnected, connect } = useWallet();

  const [activeTab, setActiveTab]         = useState<ProfileTab>('overview');
  const [documentCid, setDocumentCid]     = useState('');
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [message, setMessage]             = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);

  // Nominee state
  const [nomineeName, setNomineeName]         = useState('Robert Doe');
  const [nomineeEmail, setNomineeEmail]       = useState('robert.doe@example.com');
  const [nomineeRelationship, setNomineeRelationship] = useState('Son / Primary Heir');
  const [nomineeWallet, setNomineeWallet]     = useState('0x9999999999999999999999999999999999999999');
  const [nomineeSaved, setNomineeSaved]       = useState(false);

  const kycCfg = KYC_STATUS_CONFIG[user?.kyc_status ?? 'not_submitted'];

  const handleLinkWallet = async () => {
    setError(null); setMessage(null); setIsLinkingWallet(true);
    try {
      let activeAddress = address;
      if (!activeAddress) activeAddress = await connect();
      const { nonce } = await authService.requestWalletNonce(activeAddress);
      const signature = await (window as any).ethereum.request({ method: 'personal_sign', params: [nonce, activeAddress] });
      const res = await authService.verifyWallet(activeAddress, signature);
      if (user) updateUser({ ...user, wallet_address: res.wallet_address });
      setMessage('Wallet linked successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to link wallet');
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setMessage(null); setIsSubmittingKYC(true);
    try {
      if (!documentCid) throw new Error('Document CID or link is required');
      if (user) updateUser({ ...user, kyc_status: 'pending' });
      setMessage('KYC documents submitted. Pending admin review — usually 1-2 business days.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC');
    } finally {
      setIsSubmittingKYC(false);
    }
  };

  const handleSaveNominee = (e: React.FormEvent) => {
    e.preventDefault();
    setNomineeSaved(true);
    setMessage('Nominee & beneficiary details updated successfully.');
    setTimeout(() => setNomineeSaved(false), 4000);
  };

  const STATS = [
    { icon: '🏆', label: 'Trust Level',      value: 'Gold Investor',  color: 'text-amber-400' },
    { icon: '🎖️', label: 'Recognition Badges', value: '5 Badges',      color: 'text-indigo-400' },
    { icon: '💰', label: 'Portfolio Value',   value: '₹2,45,000',     color: 'text-white' },
    { icon: '🗺️', label: 'Trust Journey',     value: '6 / 7 Steps',   color: 'text-emerald-400' },
    { icon: '🗳️', label: 'DAO Votes',         value: '2 Votes',       color: 'text-indigo-400' },
    { icon: '💸', label: 'Rental Income',     value: '₹6,450',        color: 'text-emerald-400' },
  ];

  const TABS: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',     label: 'Overview',     icon: <User className="w-4 h-4" /> },
    { id: 'kyc',          label: 'KYC & Wallet', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'security',     label: 'Security',     icon: <Lock className="w-4 h-4" /> },
    { id: 'preferences',  label: 'Preferences',  icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="page-container animate-fade-in">

      {/* ── Header Hero ── */}
      <div className="relative rounded-3xl overflow-hidden p-8 mb-6 border border-white/[0.06]"
        style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(15,23,42,0.9) 70%)' }}>
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/20">
            {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white">{user?.full_name}</h1>
              <span className="level-badge level-gold">🥇 Gold Investor</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`pill-badge ${kycCfg.badge}`}><ShieldCheck className="w-3 h-3" /> KYC {kycCfg.label}</span>
              <span className="pill-badge pill-info capitalize">{user?.role?.replace('_', ' ')}</span>
              {user?.wallet_address && (
                <span className="pill-badge pill-neutral font-mono">{truncateAddress(user.wallet_address)}</span>
              )}
              <span className="pill-badge pill-neutral">Member since Nov 2024</span>
            </div>
          </div>

          <button className="btn-ghost text-sm shrink-0">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6 stagger-children">
        {STATS.map(s => (
          <div key={s.label} className="stat-card text-center py-4 animate-slide-up">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alerts ── */}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="tab-bar inline-flex mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab-item flex items-center gap-1.5 ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Profile Details */}
          <div className="stat-card">
            <p className="section-header mb-5"><User className="w-4 h-4 text-indigo-400" /> Profile Details</p>
            <div className="space-y-4">
              {[
                { label: 'Full Name',   value: user?.full_name },
                { label: 'Email',       value: user?.email },
                { label: 'Role',        value: user?.role?.replace('_', ' '), capitalize: true },
                { label: 'Member Since',value: 'November 2024' },
                { label: 'Web3 Wallet EOA', value: user?.wallet_address || address || '0x71C7656EC8ab88F190278148b1110098487A3E21' },
                { label: 'Wallet Type', value: user?.wallet_type || 'MetaMask / WalletConnect v2' },
                { label: 'Active Network', value: 'Polygon Amoy Testnet (Chain 80002)' },
              ].map(f => (
                <div key={f.label}>
                  <label className="label text-xs">{f.label}</label>
                  <div className={`input-field bg-slate-900/50 text-white font-medium ${f.capitalize ? 'capitalize' : ''}`}
                    style={{ cursor: 'default' }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Compliance Layer */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-5">
              <p className="section-header"><Scale className="w-4 h-4 text-blue-400" /> Compliance Profile</p>
              <span className="pill-badge pill-success text-xs">ERC-3643 Ready</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'KYC Status',       value: kycCfg.label,      color: kycCfg.color },
                { label: 'Jurisdiction',      value: 'India (356)',     color: 'text-blue-400' },
                { label: 'Whitelist Status',  value: 'Active',         color: 'text-emerald-400' },
                { label: 'Risk Profile',      value: 'Medium',         color: 'text-amber-400' },
                { label: 'AML Check',         value: 'Passed',         color: 'text-emerald-400' },
                { label: 'Investment Cap',    value: '₹50L/year',      color: 'text-white' },
              ].map(c => (
                <div key={c.label} className="px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
                  <div className="text-xs text-slate-500 mb-1">{c.label}</div>
                  <div className={`text-sm font-bold ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>
            <SmartWalletPanel />
          </div>

          {/* Recognition-Only Badges (No financial incentives, non-redeemable) */}
          <div className="lg:col-span-2">
            <RecognitionBadges />
          </div>

          {/* Nominee & Beneficiary */}
          <div className="stat-card lg:col-span-2">
            <p className="section-header mb-5"><Users className="w-4 h-4 text-purple-400" /> Nominee & Beneficiary</p>
            <form onSubmit={handleSaveNominee} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nominee Full Name',    value: nomineeName,         setter: setNomineeName },
                { label: 'Nominee Email',        value: nomineeEmail,        setter: setNomineeEmail },
                { label: 'Relationship',         value: nomineeRelationship, setter: setNomineeRelationship },
                { label: 'Nominee Wallet Address', value: nomineeWallet,     setter: setNomineeWallet },
              ].map(f => (
                <div key={f.label}>
                  <label className="label">{f.label}</label>
                  <input
                    className="input-field"
                    value={f.value}
                    onChange={e => f.setter(e.target.value)}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary text-sm">
                  <FileCheck className="w-4 h-4" />
                  {nomineeSaved ? 'Saved!' : 'Save Nominee Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ KYC TAB ══════════ */}
      {activeTab === 'kyc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* KYC Status */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-5">
              <p className="section-header"><ShieldCheck className="w-4 h-4 text-indigo-400" /> KYC Verification</p>
              <span className={`pill-badge ${kycCfg.badge}`}>{kycCfg.label}</span>
            </div>

            {user?.kyc_status === 'approved' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-white mb-1">Identity Verified</div>
                <p className="text-sm text-slate-400">Your KYC is complete. You have full access to all investment features.</p>
                <div className="mt-4 pill-badge pill-success mx-auto inline-flex">+200 reward points earned</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitKYC} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="label">Identity Document Type</label>
                    <select className="input-field bg-slate-950 text-white text-xs">
                      <option value="pan">PAN Card (Permanent Account Number)</option>
                      <option value="aadhaar">Aadhaar National ID</option>
                      <option value="passport">International Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Upload Identity Document File</label>
                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-950 border border-dashed border-indigo-500/40 hover:border-indigo-500 cursor-pointer transition-all text-xs text-indigo-300 text-center">
                      <Upload className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <div>
                        <span className="font-semibold text-white">Click or Drag & Drop File</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 10MB)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const generatedCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
                            setDocumentCid(`ipfs://${generatedCid}/${file.name}`);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="label">IPFS CID Reference</label>
                    <input
                      className="input-field font-mono text-xs bg-slate-950"
                      placeholder="ipfs://QmXoypiz... or https://ipfs.io/..."
                      value={documentCid}
                      onChange={e => setDocumentCid(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
                  ⚠️ Documents are verified by our compliance team within 1–2 business days. Approved KYC earns +200 reward points.
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingKYC}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {isSubmittingKYC ? 'Submitting...' : 'Submit KYC Documents'}
                </button>
              </form>
            )}
          </div>

          {/* Wallet */}
          <div className="stat-card">
            <p className="section-header mb-5"><Wallet className="w-4 h-4 text-emerald-400" /> Web3 Wallet</p>
            <div className="space-y-4">
              <div>
                <label className="label">Linked Wallet Address</label>
                <div className="input-field font-mono text-sm bg-slate-900/50" style={{ cursor: 'default' }}>
                  {user?.wallet_address ? truncateAddress(user.wallet_address) : 'No wallet linked'}
                </div>
              </div>
              <div>
                <label className="label">Connected Wallet</label>
                <div className="input-field font-mono text-sm bg-slate-900/50 flex items-center gap-2" style={{ cursor: 'default' }}>
                  {isConnected
                    ? <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />{truncateAddress(address)}</>
                    : <span className="text-slate-500">Not connected</span>
                  }
                </div>
              </div>
              <button
                onClick={handleLinkWallet}
                disabled={isLinkingWallet}
                className="btn-secondary w-full"
              >
                <Wallet className="w-4 h-4" />
                {isLinkingWallet ? 'Verifying Signature...' : user?.wallet_address ? 'Re-link / Switch Wallet' : 'Connect & Link Wallet'}
              </button>
              <p className="text-xs text-slate-500">
                Linking your wallet enables on-chain token ownership, dividend claims, and DAO voting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SECURITY TAB ══════════ */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stat-card">
            <p className="section-header mb-5"><Lock className="w-4 h-4 text-red-400" /> Password & Security</p>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <button className="btn-primary text-sm w-full"><Lock className="w-4 h-4" /> Update Password</button>
            </div>
          </div>

          <div className="stat-card space-y-6">
            <div>
              <p className="section-header mb-4"><Shield className="w-4 h-4 text-indigo-400" /> Active Device Sessions</p>
              <p className="text-xs text-slate-400 mb-4">Sessions stored & authenticated via Supabase PostgreSQL refresh token rotation.</p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-300 font-bold text-xs">
                      CURRENT
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Chrome on Windows (This Device)</div>
                      <div className="text-[10px] text-slate-400 font-mono">IP: 103.142.18.22 • Active now</div>
                    </div>
                  </div>
                  <span className="pill-badge pill-success text-[10px]">Active</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs">
                      MOBILE
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Safari on iOS 17</div>
                      <div className="text-[10px] text-slate-400 font-mono">IP: 157.48.91.02 • 2 hours ago</div>
                    </div>
                  </div>
                  <button className="text-xs text-red-400 hover:text-red-300 font-semibold">Revoke</button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
              <button
                onClick={() => authService.logout().then(() => window.location.href = '/login')}
                className="btn-secondary text-xs w-full py-2"
              >
                Sign Out Current Device
              </button>
              <button
                onClick={() => authService.logout().then(() => window.location.href = '/login')}
                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs font-bold transition-all w-full"
              >
                Revoke All Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ PREFERENCES TAB ══════════ */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stat-card">
            <p className="section-header mb-5"><Bell className="w-4 h-4 text-amber-400" /> Notification Preferences</p>
            <div className="space-y-3">
              {[
                { label: 'Dividend Income Alerts',    desc: 'Notify when rental/dividend income is received',  on: true },
                { label: 'Investment Confirmations',  desc: 'On-chain confirmation of token purchases',        on: true },
                { label: 'DAO Governance Proposals',  desc: 'New proposals requiring your vote',              on: true },
                { label: 'Reward Points Earned',      desc: 'When you earn points from platform actions',      on: true },
                { label: 'Price Alerts',              desc: 'Significant changes in token valuations',         on: false },
                { label: 'Marketing Updates',         desc: 'New asset listings and platform news',            on: false },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                  <div>
                    <div className="text-sm font-medium text-white">{n.label}</div>
                    <div className="text-xs text-slate-500">{n.desc}</div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${n.on ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${n.on ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <p className="section-header mb-5"><Settings className="w-4 h-4 text-slate-400" /> Investment Preferences</p>
            <div className="space-y-4">
              <div>
                <label className="label">Risk Tolerance</label>
                <select className="input-field">
                  <option>Medium Risk</option>
                  <option>Low Risk</option>
                  <option>High Risk</option>
                </select>
              </div>
              <div>
                <label className="label">Preferred Asset Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Real Estate', 'Agriculture', 'Renewable Energy', 'Commercial', 'Infrastructure', 'Healthcare'].map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 hover:border-indigo-500/30 transition-colors">
                      <input type="checkbox" defaultChecked={['Real Estate','Agriculture'].includes(t)}
                        className="w-4 h-4 rounded accent-indigo-500" />
                      <span className="text-xs text-slate-300 font-medium">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Minimum Investment Ticket</label>
                <select className="input-field">
                  <option>₹5,000</option>
                  <option>₹10,000</option>
                  <option>₹25,000</option>
                  <option>₹50,000</option>
                </select>
              </div>
              <button className="btn-primary text-sm w-full">Save Preferences</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
