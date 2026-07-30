/**
 * Activity Service — Unified activity feed.
 *
 * Aggregates THREE existing sources (no new tables created):
 *   1. indexedEventStore  → blockchain on-chain events (TokensPurchased, AssetTokenized, ProposalCreated, etc.)
 *   2. auditService       → admin/system events (KYC approved, asset approved, fraud alerts)
 *   3. portfolioService   → investment/dividend records (for per-user enrichment)
 *
 * Maps all events to a flat ActivityEvent shape for the Activity Center UI.
 */

import { indexedEventStore } from '../indexer/event.indexer';
import { auditService } from '../audit/audit.service';

// ─── Activity Event (unified shape) ──────────────────────────────────────────

export type ActivityCategory =
  | 'investment'      // User bought tokens
  | 'token_mint'      // Asset tokenized → tokens minted on-chain
  | 'dao_vote'        // Governance proposal vote
  | 'treasury_claim'  // Dividend / treasury claim
  | 'marketplace'     // Marketplace purchase
  | 'asset_approval'  // Admin approved/rejected an asset
  | 'kyc'             // KYC approved / rejected
  | 'nominee'         // Nominee / inheritance update
  | 'system';         // Other system events

export type ActivityStatus = 'confirmed' | 'pending' | 'failed' | 'info';

export interface ActivityEvent {
  id: string;
  category: ActivityCategory;
  title: string;
  subtitle: string;
  status: ActivityStatus;
  timestamp: string;               // ISO string
  txHash?: string;                 // Present for on-chain events
  explorerLink?: string;           // Polygon Amoy block explorer URL
  blockNumber?: number;
  confirmations?: number;
  amount?: string;                 // e.g. '+500 ACT' or '-$10,000'
  amountPositive?: boolean;
  assetName?: string;
  metadata?: Record<string, any>;  // Raw args for details drawer
  source: 'blockchain' | 'audit' | 'system';
}

// ─── Event Name → Category mapping ───────────────────────────────────────────

const BLOCKCHAIN_EVENT_MAP: Record<string, { category: ActivityCategory; titleFn: (args: Record<string, string>) => string; subtitleFn: (args: Record<string, string>) => string; amountFn?: (args: Record<string, string>) => string; positive?: boolean }> = {
  TokensPurchased: {
    category: 'investment',
    titleFn: () => 'Token Purchase Confirmed',
    subtitleFn: (a) => `Bought ${a.amount ?? '?'} tokens — Asset #${a.assetId ?? '?'}`,
    amountFn: (a) => `-${parseInt(a.amount ?? '0').toLocaleString()} tokens`,
    positive: false,
  },
  AssetTokenized: {
    category: 'token_mint',
    titleFn: () => 'Asset Tokenized — Tokens Minted',
    subtitleFn: (a) => `Total supply: ${parseInt(a.totalSupply ?? '0').toLocaleString()} tokens`,
    amountFn: (a) => `+${parseInt(a.totalSupply ?? '0').toLocaleString()} tokens`,
    positive: true,
  },
  AssetRegistered: {
    category: 'asset_approval',
    titleFn: () => 'Asset Registered On-Chain',
    subtitleFn: (a) => `Asset #${a.assetId ?? '?'} registered by ${a.owner?.slice(0, 8) ?? '?'}...`,
    positive: undefined,
  },
  ProposalCreated: {
    category: 'dao_vote',
    titleFn: () => 'DAO Governance Proposal Created',
    subtitleFn: (a) => a.description ? `"${a.description.slice(0, 80)}"` : `Proposal #${a.proposalId}`,
    positive: undefined,
  },
  VoteCast: {
    category: 'dao_vote',
    titleFn: (a) => `DAO Vote Cast — ${a.support === 'true' ? 'FOR' : 'AGAINST'}`,
    subtitleFn: (a) => `Proposal #${a.proposalId ?? '?'} · Voting power: ${a.votes ?? '?'}`,
    positive: undefined,
  },
  DividendDistributed: {
    category: 'treasury_claim',
    titleFn: () => 'Treasury Dividend Distributed',
    subtitleFn: (a) => `Amount: ${a.amount ?? '?'} USDC`,
    amountFn: (a) => `+${a.amount ?? '?'} USDC`,
    positive: true,
  },
  DividendClaimed: {
    category: 'treasury_claim',
    titleFn: () => 'Dividend Claimed',
    subtitleFn: (a) => `Claimed ${a.amount ?? '?'} USDC to ${a.claimer?.slice(0, 8) ?? '?'}...`,
    amountFn: (a) => `+${a.amount ?? '?'} USDC`,
    positive: true,
  },
  TokensListed: {
    category: 'marketplace',
    titleFn: () => 'Tokens Listed on Marketplace',
    subtitleFn: (a) => `${a.amount ?? '?'} tokens @ $${a.pricePerToken ?? '?'} each`,
    positive: undefined,
  },
  NomineeRegistered: {
    category: 'nominee',
    titleFn: () => 'Nominee Registered',
    subtitleFn: (a) => `Nominee: ${a.nominee?.slice(0, 8) ?? '?'}... · Allocation: ${a.allocationBps ?? '?'} bps`,
    positive: undefined,
  },
};

const AUDIT_EVENT_MAP: Record<string, { category: ActivityCategory }> = {
  asset_approved:       { category: 'asset_approval' },
  asset_rejected:       { category: 'asset_approval' },
  asset_tokenized:      { category: 'token_mint' },
  kyc_approved:         { category: 'kyc' },
  kyc_rejected:         { category: 'kyc' },
  admin_action:         { category: 'system' },
  contract_event:       { category: 'system' },
  fraud_detected:       { category: 'system' },
  security_alert:       { category: 'system' },
  payment_verified:     { category: 'investment' },
  dividend_distributed: { category: 'treasury_claim' },
};

// ─── Service ──────────────────────────────────────────────────────────────────

export interface ActivityQueryOptions {
  category?: ActivityCategory;
  userId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export class ActivityService {
  /**
   * Get unified activity feed — merges blockchain events + audit log.
   * Zero new database queries — reads from existing in-memory stores.
   */
  getActivityFeed(opts: ActivityQueryOptions = {}): {
    activities: ActivityEvent[];
    total: number;
    page: number;
    limit: number;
  } {
    const { category, page = 1, limit = 50, search } = opts;

    const all: ActivityEvent[] = [
      ...this.fromBlockchain(),
      ...this.fromAuditLog(),
    ];

    // Sort descending by timestamp
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by category
    let filtered = category ? all.filter((e) => e.category === category) : all;

    // Filter by search term
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(s) ||
          e.subtitle.toLowerCase().includes(s) ||
          e.txHash?.toLowerCase().includes(s) ||
          e.assetName?.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const activities = filtered.slice(start, start + limit);

    return { activities, total, page, limit };
  }

  /**
   * Get activity stats for the summary cards.
   */
  getStats() {
    const all = [...this.fromBlockchain(), ...this.fromAuditLog()];
    const now = Date.now();
    const oneDay = 86400000;

    return {
      total: all.length,
      today: all.filter((e) => now - new Date(e.timestamp).getTime() < oneDay).length,
      onChain: all.filter((e) => e.source === 'blockchain').length,
      investments: all.filter((e) => e.category === 'investment').length,
      tokenMints: all.filter((e) => e.category === 'token_mint').length,
      daoVotes: all.filter((e) => e.category === 'dao_vote').length,
      treasuryClaims: all.filter((e) => e.category === 'treasury_claim').length,
    };
  }

  // ─── Private Mappers ───────────────────────────────────────────────────────

  private fromBlockchain(): ActivityEvent[] {
    const { events } = indexedEventStore.getAll(1, 200);
    return events.map((ev) => {
      const mapping = BLOCKCHAIN_EVENT_MAP[ev.eventName];
      return {
        id: `bc-${ev.id}`,
        category: mapping?.category ?? 'system',
        title: mapping?.titleFn(ev.args) ?? ev.eventName,
        subtitle: mapping?.subtitleFn(ev.args) ?? `Contract: ${ev.contractAddress.slice(0, 10)}...`,
        status: ev.confirmations >= 6 ? 'confirmed' : 'pending',
        timestamp: ev.timestamp,
        txHash: ev.txHash,
        explorerLink: ev.txHash ? `https://amoy.polygonscan.com/tx/${ev.txHash}` : undefined,
        blockNumber: ev.blockNumber,
        confirmations: ev.confirmations,
        amount: mapping?.amountFn ? mapping.amountFn(ev.args) : undefined,
        amountPositive: mapping?.positive,
        metadata: {
          eventName: ev.eventName,
          contractAddress: ev.contractAddress,
          args: ev.args,
          blockNumber: ev.blockNumber,
          confirmations: ev.confirmations,
        },
        source: 'blockchain' as const,
      };
    });
  }

  private fromAuditLog(): ActivityEvent[] {
    const logs = auditService.getLog(200);
    return logs.map((ev) => {
      const mapping = AUDIT_EVENT_MAP[ev.type];
      const statusMap: Record<string, ActivityStatus> = {
        info: 'confirmed',
        warning: 'pending',
        critical: 'failed',
      };
      const txHash = ev.metadata?.txHash;
      return {
        id: `audit-${ev.id}`,
        category: mapping?.category ?? 'system',
        title: this.auditTitle(ev.type, ev.description),
        subtitle: ev.description,
        status: statusMap[ev.severity] ?? 'confirmed',
        timestamp: ev.timestamp,
        txHash,
        explorerLink: txHash ? `https://amoy.polygonscan.com/tx/${txHash}` : undefined,
        amount: ev.metadata?.amount,
        amountPositive: ev.metadata?.amountPositive,
        assetName: ev.metadata?.assetTitle || ev.metadata?.assetId,
        metadata: {
          type: ev.type,
          actorId: ev.actorId,
          actorRole: ev.actorRole,
          severity: ev.severity,
          ...ev.metadata,
        },
        source: 'audit' as const,
      };
    });
  }

  private auditTitle(type: string, description: string): string {
    const titles: Record<string, string> = {
      asset_approved: 'Asset Approved for Tokenization',
      asset_rejected: 'Asset Rejected',
      asset_tokenized: 'Asset Tokenization Complete',
      kyc_approved: 'KYC Identity Verified',
      kyc_rejected: 'KYC Rejected',
      kyc_submitted: 'KYC Documents Submitted',
      admin_action: 'Admin Action',
      contract_event: 'Smart Contract Event',
      fraud_detected: '⚠️ Fraud Alert Detected',
      security_alert: '🚨 Security Alert',
      payment_verified: 'Payment Verified',
      dividend_distributed: 'Dividend Distributed',
    };
    return titles[type] ?? description.slice(0, 60);
  }
}

export const activityService = new ActivityService();
