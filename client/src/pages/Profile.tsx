import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { User, Wallet, ShieldCheck, Upload, AlertCircle, CheckCircle2, Users, FileCheck, Globe, Scale } from 'lucide-react';
import { truncateAddress } from '../lib/utils';
import { authService } from '../services/authService';
import { SmartWalletPanel } from '../components/wallet/SmartWalletPanel';

export function Profile() {
  const { user, updateUser } = useAuth();
  const { address, isConnected, connect } = useWallet();

  const [documentCid, setDocumentCid] = useState('');
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nominee State (Module 17)
  const [nomineeName, setNomineeName] = useState('Robert Doe');
  const [nomineeEmail, setNomineeEmail] = useState('robert.doe@example.com');
  const [nomineePhone, setNomineePhone] = useState('+1 (555) 234-5678');
  const [nomineeGovId, setNomineeGovId] = useState('US-PASSPORT-998811');
  const [nomineeRelationship, setNomineeRelationship] = useState('Son / Primary Heir');
  const [nomineeWallet, setNomineeWallet] = useState('0x9999999999999999999999999999999999999999');
  const [nomineeSaved, setNomineeSaved] = useState(false);

  // Link MetaMask wallet to user account
  const handleLinkWallet = async () => {
    setError(null);
    setMessage(null);
    setIsLinkingWallet(true);

    try {
      let activeAddress = address;
      if (!activeAddress) {
        activeAddress = await connect();
      }

      const { nonce } = await authService.requestWalletNonce(activeAddress);
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonce, activeAddress],
      });

      const res = await authService.verifyWallet(activeAddress, signature);

      if (user) {
        updateUser({ ...user, wallet_address: res.wallet_address });
      }
      setMessage('Wallet linked successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to link wallet');
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmittingKYC(true);

    try {
      if (!documentCid) throw new Error('Document CID or link is required');
      if (user) {
        updateUser({ ...user, kyc_status: 'pending' });
      }
      setMessage('KYC documents submitted successfully. Pending admin review.');
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Account Settings & Compliance</h1>
        <p className="text-xs text-slate-400">Manage your profile, legal compliance layer, nominee, and Web3 wallet</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Profile Details</h3>
              <p className="text-[11px] text-slate-400">Registered user information</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Full Name</span>
              <div className="font-semibold text-white p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                {user?.full_name}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Email Address</span>
              <div className="font-semibold text-white p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                {user?.email}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Role</span>
              <div className="font-semibold text-indigo-300 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 capitalize">
                {user?.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Web3 Wallet Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Web3 Wallet</h3>
              <p className="text-[11px] text-slate-400">Linked Ethereum / Polygon address</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Linked Wallet</span>
              <div className="font-mono text-slate-200 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                {user?.wallet_address ? truncateAddress(user.wallet_address) : 'No wallet linked'}
              </div>
            </div>

            <button
              onClick={handleLinkWallet}
              disabled={isLinkingWallet}
              className="btn-secondary w-full text-xs py-2.5"
            >
              {isLinkingWallet ? 'Verifying Signature...' : user?.wallet_address ? 'Re-link / Switch Wallet' : 'Connect & Link Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Layer Card — Module 16 */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Compliance & Whitelist Profile (ERC-3643 Ready)</h3>
              <p className="text-[11px] text-slate-400">Automated transfer permission & regulatory risk profile</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ERC-3643 Compatible
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">KYC Status</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Jurisdiction</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-400" /> United States (840)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Risk Tier</span>
            <span className="font-semibold text-indigo-300">Tier 1 (Low Risk)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Transfer Permission</span>
            <span className="font-semibold text-emerald-400">Allowed</span>
          </div>
        </div>
      </div>

      {/* Nominee & Inheritance Card — Module 17 */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Nominee & Beneficiary Designation (Module 17)</h3>
            <p className="text-[11px] text-slate-400">Assign legal nominee for off-chain inheritance & token transfer</p>
          </div>
        </div>

        <form onSubmit={handleSaveNominee} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="label">Nominee Full Name</label>
            <input
              type="text"
              required
              value={nomineeName}
              onChange={(e) => setNomineeName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Relationship</label>
            <input
              type="text"
              required
              value={nomineeRelationship}
              onChange={(e) => setNomineeRelationship(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              required
              value={nomineeEmail}
              onChange={(e) => setNomineeEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Government ID / Passport</label>
            <input
              type="text"
              required
              value={nomineeGovId}
              onChange={(e) => setNomineeGovId(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Nominee Wallet Address</label>
            <input
              type="text"
              required
              value={nomineeWallet}
              onChange={(e) => setNomineeWallet(e.target.value)}
              className="input-field font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary text-xs py-2.5 w-full sm:w-auto">
              <FileCheck className="w-4 h-4" /> Save Nominee Details
            </button>
          </div>
        </form>
      </div>

      {/* KYC Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">KYC / Identity Verification</h3>
            <p className="text-[11px] text-slate-400">Submit legal proof of identity for regulatory compliance</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400">Current Status</span>
          <span className={`px-2.5 py-1 rounded-full font-semibold uppercase text-[10px] tracking-wider ${
            user?.kyc_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
            user?.kyc_status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
            'bg-slate-800 text-slate-400'
          }`}>
            {user?.kyc_status.replace('_', ' ')}
          </span>
        </div>

        {user?.kyc_status !== 'approved' && (
          <form onSubmit={handleSubmitKYC} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="label">IPFS Document CID / Passport Hash</label>
              <input
                type="text"
                required
                value={documentCid}
                onChange={(e) => setDocumentCid(e.target.value)}
                placeholder="e.g. QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingKYC}
              className="btn-primary text-xs py-2.5"
            >
              <Upload className="w-4 h-4" /> {isSubmittingKYC ? 'Submitting...' : 'Submit Documents'}
            </button>
          </form>
        )}
      </div>

      <SmartWalletPanel />
    </div>
  );
}
