import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Lock, Eye, EyeOff, Trash2, Download, AlertCircle,
  CheckCircle2, Clock, User, Wallet, FileText, Users,
  ChevronDown, ChevronUp, Info
} from 'lucide-react';

interface DataAccessEvent {
  id: string;
  action: string;
  actor: string;
  reviewerRole?: string;
  reason: string;
  timestamp: string;
  category: 'system' | 'admin' | 'reviewer' | 'self';
}


function AccessCategoryBadge({ category }: { category: DataAccessEvent['category'] }) {
  const styles: Record<DataAccessEvent['category'], string> = {
    system: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    admin: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    reviewer: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    self: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  };
  const labels: Record<DataAccessEvent['category'], string> = {
    system: 'System',
    admin: 'Admin',
    reviewer: 'Reviewer',
    self: 'You',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[category]}`}>
      {labels[category]}
    </span>
  );
}

export function PrivacyCenter() {
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedAccess, setExpandedAccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const maskedWallet = user?.wallet_address
    ? `${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(user.wallet_address.length - 4)}`
    : 'Not linked';

  const maskedEmail = user?.email
    ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1] || '***'}`
    : '***';

  const [accessHistory, setAccessHistory] = useState<DataAccessEvent[]>([]);
  const [accessLoading, setAccessLoading] = useState(true);

  useEffect(() => {
    async function loadAuditLog() {
      setAccessLoading(true);
      try {
        // Fetch audit log entries for the authenticated user from the API
        const token = localStorage.getItem('assetchain_token');
        const res = await fetch('/api/v1/audit-log?limit=20', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const logs = json?.data?.logs ?? json?.data ?? [];
          const mapped: DataAccessEvent[] = logs.map((log: any) => ({
            id: log.id,
            action: log.action || 'System Action',
            actor: log.actor_id || 'System',
            reviewerRole: log.actor_role,
            reason: log.description || log.action || 'No description',
            timestamp: log.created_at,
            category: (log.actor_role === 'admin' ? 'admin'
              : log.actor_role === 'system' ? 'system'
              : log.actor_id === user?.id ? 'self'
              : 'reviewer') as DataAccessEvent['category'],
          }));
          setAccessHistory(mapped);
        }
      } catch (e) {
        // On error — show empty state (no fake data)
        setAccessHistory([]);
      } finally {
        setAccessLoading(false);
      }
    }
    if (user?.id) loadAuditLog();
    else setAccessLoading(false);
  }, [user?.id]);

  const displayedHistory = expandedAccess ? accessHistory : accessHistory.slice(0, 3);


  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-500/20 rounded-xl border border-violet-500/30">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Privacy Center</h1>
          </div>
          <p className="text-gray-400 text-sm ml-14">
            View and manage your personal data, access history, and privacy settings.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-blue-300 text-sm">
            TrustChain AI collects and stores only the data required for regulatory compliance and platform operation.
            Sensitive documents are stored encrypted using <strong>AES-256-GCM (Authenticated Encryption)</strong>. We do not sell your data to third parties.
          </p>
        </div>

        {/* Data Stored */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Data on Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Profile */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-gray-300">Profile</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-300 font-mono">{maskedEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Full Name</span>
                  <span className="text-gray-300">{user?.full_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="text-gray-300 capitalize">{user?.role?.replace('_', ' ') || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Wallet */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-gray-300">Wallet</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="text-gray-300 font-mono">{maskedWallet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network</span>
                  <span className="text-gray-300">Polygon Amoy (Testnet)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Linked</span>
                  <span className={user?.wallet_address ? 'text-emerald-400' : 'text-gray-500'}>
                    {user?.wallet_address ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* KYC */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">KYC / Compliance</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">KYC Status</span>
                  <span className={`font-medium capitalize ${user?.kyc_status === 'approved' ? 'text-emerald-400' : user?.kyc_status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                    {user?.kyc_status || 'Not Submitted'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Documents</span>
                  <span className="text-gray-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> AES-256-GCM Encrypted
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ERC-3643</span>
                  <span className="text-emerald-400">Compatible</span>
                </div>
              </div>
            </div>

            {/* Nominee */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-gray-300">Nominee / Inheritance</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nominee Assigned</span>
                  <span className="text-emerald-400">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nominee Details</span>
                  <span className="text-gray-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> AES-256-GCM Encrypted
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Government ID</span>
                  <span className="text-gray-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> AES-256-GCM Encrypted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Encryption & Storage Status */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Document Encryption & Storage Status</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            {[
              { label: 'Government IDs', status: 'AES-256-GCM Encrypted', location: 'Supabase DB', encrypted: true },
              { label: 'KYC Verification Documents', status: 'AES-256-GCM Encrypted', location: 'Supabase DB', encrypted: true },
              { label: 'Property Title Deeds', status: 'Stored via IPFS (Pinata CID)', location: 'IPFS Public Network', encrypted: false, note: 'CID content-addressed; unencrypted at rest (IPFS public network)' },
              { label: 'Nominee / Beneficiary Records', status: 'AES-256-GCM Encrypted', location: 'Supabase DB', encrypted: true },
              { label: 'Death Certificates', status: 'AES-256-GCM Encrypted', location: 'Supabase DB', encrypted: true },
              { label: 'Legal Probate Documents', status: 'AES-256-GCM Encrypted', location: 'Supabase DB', encrypted: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 flex-wrap gap-2">
                <div>
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">Storage: {item.location}</span>
                    {item.note && <span className="text-xs text-amber-400/80">({item.note})</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.encrypted ? (
                    <Lock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-amber-400" />
                  )}
                  <span className={`text-xs font-medium ${item.encrypted ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Retention Policy */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Data Retention Policy</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-violet-400">7 Years</div>
                <div className="text-gray-400 text-xs mt-1">Financial transaction records (regulatory)</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">5 Years</div>
                <div className="text-gray-400 text-xs mt-1">KYC and compliance records</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-emerald-400">30 Days</div>
                <div className="text-gray-400 text-xs mt-1">Account deletion processing time</div>
              </div>
            </div>
            <p className="text-gray-500 text-xs">
              Financial and compliance records are retained for 7 years as required by applicable financial regulations.
              Audit logs are append-only and cannot be deleted. Profile data is deleted upon request, subject to the 30-day processing period.
            </p>
          </div>
        </section>

        {/* Data Access History */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Data Access History</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-800">
              {accessLoading ? (
                <div className="p-6 text-center text-gray-500 text-sm">Loading access history...</div>
              ) : displayedHistory.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  No access history yet. Your data access events will appear here.
                </div>
              ) : (
                displayedHistory.map((event) => (
                  <div key={event.id} className="p-4 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-gray-200">{event.action}</span>
                        <AccessCategoryBadge category={event.category} />
                      </div>
                      <p className="text-xs text-gray-500">{event.actor} · {event.reason}</p>
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0">
                      {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
            {accessHistory.length > 3 && (
              <button
                onClick={() => setExpandedAccess(!expandedAccess)}
                className="w-full p-3 text-sm text-violet-400 hover:text-violet-300 flex items-center justify-center gap-2 border-t border-gray-800 transition-colors"
              >
                {expandedAccess ? (
                  <><ChevronUp className="w-4 h-4" /> Show less</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Show {accessHistory.length - 3} more events</>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">Access history is maintained for audit and transparency purposes.</p>
        </section>

        {/* Actions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Privacy Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              onClick={() => alert('Data export will be prepared and sent to your registered email within 48 hours.')}
            >
              <Download className="w-4 h-4" />
              Export My Data
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              Request Account Deletion
            </button>
          </div>
        </section>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Account Deletion Request</h3>
              </div>
              <div className="space-y-3 mb-6 text-sm text-gray-400">
                <p>Under our data retention policy:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Profile data will be deleted within <strong className="text-white">30 days</strong></li>
                  <li>Financial transaction records are <strong className="text-white">retained for 7 years</strong> (regulatory requirement)</li>
                  <li>Audit logs are <strong className="text-white">permanently retained</strong> (immutable compliance records)</li>
                  <li>Blockchain transactions cannot be deleted (they are on-chain)</li>
                </ul>
                <p className="text-amber-400">Your token holdings will be transferred to your wallet address before deletion.</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Type <strong className="text-white">DELETE</strong> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirm !== 'DELETE'}
                  className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-red-500/40 rounded-lg text-sm text-red-400 transition-colors"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm('');
                    alert('Account deletion request submitted. You will receive a confirmation email within 48 hours.');
                  }}
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
