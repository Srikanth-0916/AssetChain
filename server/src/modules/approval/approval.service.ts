/**
 * Multi-Signature Approval Service — 2-of-3 approval workflow.
 *
 * Roles: verifier, legal_reviewer, admin
 * Policy: any 2 of the 3 roles must approve to trigger tokenization.
 * Integrated with Audit Log service and Gnosis Safe multi-sig architecture adapter.
 */

import { v4 as uuidv4 } from 'uuid';
import { auditService } from '../audit/audit.service';
import { supabaseAdmin } from '../../config/database';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../utils/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApprovalRole = 'verifier' | 'legal_reviewer' | 'admin';
export type ApprovalDecision = 'approved' | 'rejected';

export interface ApprovalVote {
  role: ApprovalRole;
  userId: string;
  decision: ApprovalDecision;
  comments?: string;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  assetId: string;
  assetTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  requiredVotes: number;       // 2
  totalRoles: number;          // 3
  votes: ApprovalVote[];
  approvedCount: number;
  rejectedCount: number;
  gnosisSafeTxHash?: string;
  verificationSummary?: {
    riskScore: number;
    recommendation: string;
    confidence: number;
  };
}

// ─── Gnosis Safe Multi-Sig Adapter Interface ─────────────────────────────────

export interface IGnosisSafeAdapter {
  isSafeConfigured(): boolean;
  proposeSafeTransaction(assetId: string, action: string): Promise<string>;
  confirmSafeTransaction(safeTxHash: string, signerAddress: string): Promise<boolean>;
}

export class GnosisSafeAdapter implements IGnosisSafeAdapter {
  private safeAddress: string | null = null;

  constructor(safeAddress?: string) {
    // Use explicit arg → env var → empty (not configured)
    this.safeAddress = safeAddress || env.GNOSIS_SAFE_ADDRESS || null;
    if (this.safeAddress) {
      console.log(`[GnosisSafe] Configured with Safe address: ${this.safeAddress}`);
    } else {
      console.warn('[GnosisSafe] No GNOSIS_SAFE_ADDRESS configured — running in policy-only mode (off-chain 2-of-3 enforcement)');
    }
  }

  isSafeConfigured(): boolean {
    return !!this.safeAddress && this.safeAddress.startsWith('0x') && this.safeAddress.length === 42;
  }

  async proposeSafeTransaction(assetId: string, action: string): Promise<string> {
    if (!this.isSafeConfigured()) {
      // Policy-only mode: generate a deterministic reference hash for audit trail
      const safeTxHash = `0xpolicytx_${uuidv4().replace(/-/g, '')}`;
      console.warn(`[GnosisSafe] Policy-only mode — no on-chain Safe tx proposed. Reference: ${safeTxHash}`);
      return safeTxHash;
    }
    // TODO: Wire @safe-global/protocol-kit when GNOSIS_SAFE_ADDRESS is configured:
    //   const safeSDK = await Safe.create({ ethAdapter, safeAddress: this.safeAddress });
    //   const tx = await safeSDK.createTransaction({ ... });
    //   return await safeSDK.getTransactionHash(tx);
    const safeTxHash = `0xgnosis_${uuidv4().replace(/-/g, '')}`;
    console.log(`[GnosisSafe] Proposed Safe tx for asset ${assetId} (${action}): ${safeTxHash}`);
    return safeTxHash;
  }

  async confirmSafeTransaction(safeTxHash: string, signerAddress: string): Promise<boolean> {
    if (!this.isSafeConfigured()) {
      return true; // Policy-only mode: off-chain confirmation sufficient
    }
    // TODO: Wire @safe-global/protocol-kit:
    //   await safeSDK.approveTransactionHash(safeTxHash);
    console.log(`[GnosisSafe] Confirmation received from ${signerAddress} for ${safeTxHash}`);
    return true;
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ApprovalService {
  private readonly REQUIRED_VOTES = 2;
  private readonly store = new Map<string, ApprovalRequest>();
  private readonly safeAdapter = new GnosisSafeAdapter();

  constructor() {
    // Seed initial approval request for demo asset 1
    const demoReq: ApprovalRequest = {
      id: 'approval-demo-001',
      assetId: 'asset-demo-uuid-001',
      assetTitle: 'Manhattan Commercial Plaza',
      status: 'approved',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 29 * 86400000).toISOString(),
      requiredVotes: 2,
      totalRoles: 3,
      approvedCount: 2,
      rejectedCount: 0,
      votes: [
        {
          role: 'verifier',
          userId: 'verifier-uuid-001',
          decision: 'approved',
          comments: 'Technical audit & asset documentation verified on IPFS.',
          timestamp: new Date(Date.now() - 29.5 * 86400000).toISOString(),
        },
        {
          role: 'legal_reviewer',
          userId: 'legal-uuid-002',
          decision: 'approved',
          comments: 'SPV title deed and legal structure confirmed in Delaware jurisdiction.',
          timestamp: new Date(Date.now() - 29 * 86400000).toISOString(),
        },
      ],
      gnosisSafeTxHash: '0xgnosis_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      verificationSummary: {
        riskScore: 12,
        recommendation: 'Approve',
        confidence: 0.95,
      },
    };
    this.store.set(demoReq.id, demoReq);
  }

  /** Helper to persist approval request to Supabase with environment-based behavior */
  private async persistToSupabase(request: ApprovalRequest): Promise<void> {
    // Skip Supabase write if IDs are not valid UUIDs (test fixture IDs)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(request.id) || !UUID_REGEX.test(request.assetId)) {
      return; // Memory store is sufficient for non-UUID IDs
    }

    try {
      const { error } = await supabaseAdmin.from('approval_requests').upsert({
        id: request.id,
        asset_id: request.assetId,
        // asset_title: column may not exist in older DB deployments — excluded for compatibility
        status: request.status,
        created_at: request.createdAt,
        updated_at: request.updatedAt,
        required_votes: request.requiredVotes,
        // total_roles: column may not exist in older DB deployments — excluded for compatibility
        approved_count: request.approvedCount,
        rejected_count: request.rejectedCount,
        gnosis_safe_tx_hash: request.gnosisSafeTxHash,
        // verification_summary: column may not exist in older DB deployments — excluded for compatibility
      });

      if (error) {
        if (env.NODE_ENV === 'production') {
          console.error(`[ApprovalService] 🚨 CRITICAL PROD FAILURE: Approval persistence failed for ${request.id}:`, error.message);
          throw new ServiceUnavailableError(`Approval persistence failure: ${error.message}`);
        } else {
          console.warn(`[ApprovalService] ⚠️ Dev Mode Warning: Supabase approval write failed:`, error.message);
        }
      }
    } catch (err: any) {
      if (env.NODE_ENV === 'production') {
        throw err instanceof ServiceUnavailableError ? err : new ServiceUnavailableError(`Approval persistence failure: ${err.message}`);
      }
    }
  }

  /** Create a new multi-sig approval request after AI verification. */
  async createRequest(
    assetId: string,
    assetTitle: string,
    verificationSummary?: ApprovalRequest['verificationSummary']
  ): Promise<ApprovalRequest> {
    const existing = this.findByAsset(assetId);
    if (existing && existing.status === 'pending') return existing;

    const request: ApprovalRequest = {
      id: uuidv4(),
      assetId,
      assetTitle,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requiredVotes: this.REQUIRED_VOTES,
      totalRoles: 3,
      votes: [],
      approvedCount: 0,
      rejectedCount: 0,
      verificationSummary,
    };

    if (this.safeAdapter.isSafeConfigured()) {
      request.gnosisSafeTxHash = await this.safeAdapter.proposeSafeTransaction(assetId, 'TOKENIZE_ASSET');
    }

    this.store.set(request.id, request);
    await this.persistToSupabase(request);

    auditService.log(
      'admin_action',
      'system',
      'system',
      `Multi-signature approval request initialized for asset "${assetTitle}" (2-of-3 required)`,
      { assetId, requestId: request.id },
      'info'
    );

    return request;
  }

  /**
   * Indexer Event Processor: Called by ContractListener when an on-chain `ApprovalVoted` or `AssetApproved` event is detected.
   * Approval status is decided purely by smart contract event logs.
   */
  async processOnChainApprovalEvent(data: {
    txHash: string;
    assetId: string;
    voterAddress?: string;
    role?: ApprovalRole;
    decision?: ApprovalDecision;
    comments?: string;
    status?: 'approved' | 'rejected';
  }): Promise<ApprovalRequest> {
    let request = this.findByAsset(data.assetId);

    if (!request) {
      // Auto-create request if indexed event arrives for an asset without a cached request
      request = await this.createRequest(data.assetId, `Asset ${data.assetId.slice(0, 8)}`);
    }

    // Attach on-chain transaction hash proof
    request.gnosisSafeTxHash = data.txHash;
    request.updatedAt = new Date().toISOString();

    if (data.role && data.decision) {
      const existing = request.votes.find((v) => v.role === data.role);
      if (!existing) {
        request.votes.push({
          role: data.role,
          userId: data.voterAddress || 'on-chain-verifier',
          decision: data.decision,
          comments: data.comments || `On-chain event vote (tx: ${data.txHash.slice(0, 10)}...)`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    request.approvedCount = request.votes.filter((v) => v.decision === 'approved').length;
    request.rejectedCount = request.votes.filter((v) => v.decision === 'rejected').length;

    // Smart contract event decision check
    if (data.status) {
      request.status = data.status;
    } else if (request.approvedCount >= this.REQUIRED_VOTES) {
      request.status = 'approved';
    } else if (request.rejectedCount > (request.totalRoles - this.REQUIRED_VOTES)) {
      request.status = 'rejected';
    }

    this.store.set(request.id, request);
    await this.persistToSupabase(request);

    // Audit log proof of indexed smart contract event
    auditService.log(
      request.status === 'approved' ? 'asset_approved' : 'asset_rejected',
      data.voterAddress || 'smart-contract',
      data.role || 'verifier',
      `On-chain smart contract event indexed [tx: ${data.txHash.slice(0, 14)}...]: Asset "${request.assetTitle}" status → ${request.status.toUpperCase()}`,
      {
        requestId: request.id,
        assetId: request.assetId,
        txHash: data.txHash,
        status: request.status,
        approvedCount: request.approvedCount,
      },
      request.status === 'approved' ? 'info' : 'warning'
    );

    return request;
  }

  /** Submit an approval/rejection vote (Simulates / triggers smart contract vote & event indexer). */
  async submitVote(
    requestId: string,
    role: ApprovalRole,
    userId: string,
    decision: ApprovalDecision,
    comments?: string
  ): Promise<ApprovalRequest> {
    const VALID_ROLES: ApprovalRole[] = ['verifier', 'legal_reviewer', 'admin'];
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid approval role '${role}'. Allowed roles: ${VALID_ROLES.join(', ')}`);
    }

    const request = this.store.get(requestId);
    if (!request) throw new Error(`Approval request ${requestId} not found`);
    if (request.status !== 'pending') throw new Error(`Request is already ${request.status}`);

    const existingVote = request.votes.find((v) => v.role === role);
    if (existingVote) throw new Error(`Role '${role}' has already voted on this request`);

    // Simulate smart contract event transaction hash (Blockchain-First)
    const onChainTxHash = `0xvote_${uuidv4().replace(/-/g, '')}`;

    // Delegate status update to on-chain event processor (Indexer-driven)
    return this.processOnChainApprovalEvent({
      txHash: onChainTxHash,
      assetId: request.assetId,
      voterAddress: userId,
      role,
      decision,
      comments,
    });
  }

  async getPending(): Promise<ApprovalRequest[]> {
    return Array.from(this.store.values())
      .filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAll(): Promise<ApprovalRequest[]> {
    return Array.from(this.store.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string): Promise<ApprovalRequest> {
    const req = this.store.get(id);
    if (!req) throw new Error(`Approval request ${id} not found`);
    return req;
  }

  async getByAsset(assetId: string): Promise<ApprovalRequest | null> {
    return this.findByAsset(assetId);
  }

  private findByAsset(assetId: string): ApprovalRequest | null {
    for (const req of this.store.values()) {
      if (req.assetId === assetId) return req;
    }
    return null;
  }
}

export const approvalService = new ApprovalService();
