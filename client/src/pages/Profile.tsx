import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { User, Wallet, ShieldCheck, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { truncateAddress } from '../lib/utils';
import { authService } from '../services/authService';

export function Profile() {
  const { user, updateUser } = useAuth();
  const { address, isConnected, connect } = useWallet();

  const [documentCid, setDocumentCid] = useState('');
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      // Step 1: Request Nonce
      const { nonce } = await authService.requestWalletNonce(activeAddress);

      // Step 2: Request MetaMask Signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonce, activeAddress],
      });

      // Step 3: Verify Signature & Link
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

  // Submit KYC Document CID
  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmittingKYC(true);

    try {
      // In production, file upload → Pinata returns CID. For demo/MVP, accept input.
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Account Settings & Verification</h1>
        <p className="text-xs text-slate-400">Manage your profile, identity verification, and Web3 wallet</p>
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
    </div>
  );
}
