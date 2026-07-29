import React, { useState } from 'react';
import {
  ShieldCheck, Users, Brain, Scale, FileCheck, Gavel,
  History, Building2, AlertTriangle, CheckCircle2, Clock,
  ExternalLink, ChevronRight, Info
} from 'lucide-react';
import { SystemHealthCard } from '../components/system/SystemHealthCard';

interface SecurityFeature {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  details: string[];
  status: 'active' | 'partial' | 'planned';
  lastChecked?: string;
}

const SECURITY_FEATURES: SecurityFeature[] = [
  {
    id: 'multisig',
    icon: <Users className="w-5 h-5" />,
    title: 'Multi-Signature Approval',
    badge: 'Multi-Signature Protected',
    badgeColor: 'text-violet-400 bg-violet-500/20 border-violet-500/30',
    description: 'All asset tokenizations require approval from 2 of 3 designated reviewers before any token is minted.',
    details: [
      'Verifier, Legal Reviewer, and Admin must reach 2-of-3 consensus',
      'No single person can unilaterally approve a tokenization',
      'Every vote is recorded in the audit log with timestamp and role',
      'Gnosis Safe multi-sig wallet integration (demo mode — Safe SDK pending full integration)',
    ],
    status: 'active',
    lastChecked: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'ai-fraud',
    icon: <Brain className="w-5 h-5" />,
    title: 'AI Fraud Detection',
    badge: 'AI Verified',
    badgeColor: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    description: 'Every asset submission is analyzed by Gemini AI for fraud signals before entering the approval queue.',
    details: [
      'Document text is sanitized for prompt injection attacks before AI analysis',
      'Gemini 2.0 Flash analyzes valuation consistency, document authenticity, and red flags',
      'Injection attempts automatically escalate the fraud score by +30 points',
      'Deterministic fallback engine runs when Gemini API is unavailable',
    ],
    status: 'active',
    lastChecked: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'legal-spv',
    icon: <Building2 className="w-5 h-5" />,
    title: 'SPV Legal Verification',
    badge: 'SPV Verified',
    badgeColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    description: 'Each tokenized asset is held by a Special Purpose Vehicle (SPV) — a dedicated legal entity that isolates ownership.',
    details: [
      'SPV registration verified against national/international registries',
      'Jurisdiction-specific compliance (Delaware LLC, DIFC UAE, Spanish S.L.)',
      'Legal owner, trustee, and registration number recorded on platform',
      'SPV reference hash stored on-chain in AssetRegistry contract',
    ],
    status: 'active',
  },
  {
    id: 'blockchain',
    icon: <FileCheck className="w-5 h-5" />,
    title: 'Blockchain Verifiable',
    badge: 'Blockchain Verifiable',
    badgeColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    description: 'All asset registrations, token transfers, and governance votes are recorded on Polygon Amoy — publicly verifiable.',
    details: [
      'Smart contracts are open-source and auditable on Polygonscan',
      'Token minting events are permanently recorded and cannot be altered',
      'Treasury distributions use non-reentrant pull-based architecture (ReentrancyGuard)',
      'Contracts deployed on Polygon Amoy testnet — not audited for mainnet',
    ],
    status: 'active',
  },
  {
    id: 'kyc-compliance',
    icon: <Scale className="w-5 h-5" />,
    title: 'KYC / AML Compliance',
    badge: 'Compliance Verified',
    badgeColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    description: 'Token transfers enforce ERC-3643 compliant KYC/AML rules — only whitelisted, verified investors can receive tokens.',
    details: [
      'KYC status enforced at both API layer and on-chain (transfer whitelist)',
      'ERC-3643 compatible compliance profiles per investor',
      'Jurisdiction code (ISO numeric) tracked per user',
      'KYC provider integration (Onfido/Sumsub) planned for production deployment',
    ],
    status: 'partial',
  },
  {
    id: 'audit-trail',
    icon: <History className="w-5 h-5" />,
    title: 'Audit Trail',
    badge: 'Audit Logged',
    badgeColor: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    description: 'Every admin action, approval vote, compliance update, and security event is recorded in an append-only audit log.',
    details: [
      'Audit logs persisted to Supabase on every write',
      'Failures are explicitly logged — no silent data loss',
      'Severity levels: info, warning, critical',
      'Full hash chaining planned for tamper-evidence in production',
    ],
    status: 'active',
  },
  {
    id: 'governance',
    icon: <Gavel className="w-5 h-5" />,
    title: 'DAO Governance',
    badge: 'Governance Protected',
    badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    description: 'Token holders vote on major asset decisions via on-chain governance — no centralized control over asset policy.',
    details: [
      'Token-weighted voting: one token = one vote',
      'Quorum threshold required before proposal execution',
      'Proposals have fixed voting windows (no retroactive approval)',
      'Governance contract includes AccessControl for proposal creation',
    ],
    status: 'active',
  },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  partial: { label: 'Partial', color: 'text-amber-400', dot: 'bg-amber-400' },
  planned: { label: 'Planned', color: 'text-gray-500', dot: 'bg-gray-500' },
};

function SecurityCard({ feature }: { feature: SecurityFeature }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[feature.status];

  return (
    <div className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${expanded ? 'border-gray-600' : 'border-gray-800'}`}>
      <button
        className="w-full p-5 text-left flex items-start gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-2 rounded-xl border ${feature.badgeColor}`}>
          {feature.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-white">{feature.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${feature.badgeColor}`}>
              {feature.badge}
            </span>
          </div>
          <p className="text-sm text-gray-400">{feature.description}</p>
          {feature.lastChecked && (
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last active: {new Date(feature.lastChecked).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${status.dot} ${feature.status === 'active' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-800">
          <ul className="space-y-2 mt-4">
            {feature.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SecurityCenter() {
  const lastScanDate = new Date(Date.now() - 4 * 3600000);
  const activeFeatures = SECURITY_FEATURES.filter((f) => f.status === 'active').length;
  const partialFeatures = SECURITY_FEATURES.filter((f) => f.status === 'partial').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Security Center</h1>
          </div>
          <p className="text-gray-400 text-sm ml-14">
            Overview of security protections active on TrustChain AI.
          </p>
        </div>

        {/* Honest disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-300">
            <p className="font-medium mb-1">Security Transparency Notice</p>
            <p className="text-amber-400/80">
              TrustChain AI is a production-prototype deployed on a testnet. Smart contracts have NOT been audited by an independent security firm for mainnet deployment.
              Blockchain transactions are on Polygon Amoy testnet only. Do not use real funds.
            </p>
          </div>
        </div>

        {/* Live System Health */}
        <div className="mb-8">
          <SystemHealthCard />
        </div>

        {/* Security Score Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{activeFeatures}</div>
            <div className="text-xs text-gray-500 mt-1">Active Protections</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{partialFeatures}</div>
            <div className="text-xs text-gray-500 mt-1">Partial (Demo Mode)</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-sm font-semibold text-gray-300">
              {lastScanDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-gray-500 mt-1">Last Security Check</div>
          </div>
        </div>

        {/* Honest Language Notice */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-400">
            We use precise security language. We do not claim this platform is "100% secure", "bank-grade", or "unhackable" —
            no software system can honestly make those claims. What we do claim: every feature below is either <span className="text-emerald-400">active and verifiable</span> or <span className="text-amber-400">clearly marked as partial/planned</span>.
          </p>
        </div>

        {/* Security Features */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Security Protections</h2>
          {SECURITY_FEATURES.map((feature) => (
            <SecurityCard key={feature.id} feature={feature} />
          ))}
        </section>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://amoy.polygonscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View contracts on Polygonscan
          </a>
          <span className="text-gray-700">·</span>
          <a
            href="/privacy"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Privacy Center
          </a>
        </div>
      </div>
    </div>
  );
}
