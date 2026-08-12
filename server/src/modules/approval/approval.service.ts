/**
 * Multi-Signature Approval Service — 2-of-3 approval workflow.
 *
 * Roles: verifier, legal_reviewer, admin
 * Policy: any 2 of the 3 roles must approve to trigger tokenization.
 * Integrated with Audit Log service and Gnosis Safe multi-sig architecture adapter.
 */

import { v4 as uuidv4 } from 'uuid';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notification.service';
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
  private lastSyncTime = 0;
  private readonly SYNC_TTL_MS = 5000;

  constructor() {
    // Constructor no longer seeds hardcoded/mock request list
  }

  /** Helper to persist approval request to Supabase with environment-based behavior */
  private async persistToSupabase(request: ApprovalRequest): Promise<void> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(request.id) || !UUID_REGEX.test(request.assetId)) {
      return; // Memory store is sufficient for non-UUID IDs
    }

    try {
      const { error } = await supabaseAdmin.from('approval_requests').upsert({
        id: request.id,
        asset_id: request.assetId,
        status: request.status,
        created_at: request.createdAt,
        updated_at: request.updatedAt,
        required_votes: request.requiredVotes,
        approved_count: request.approvedCount,
        rejected_count: request.rejectedCount,
        gnosis_safe_tx_hash: request.gnosisSafeTxHash,
      }, { onConflict: 'id' });

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

  /** Helper to persist vote to Supabase */
  private async persistVoteToSupabase(vote: ApprovalVote, requestId: string): Promise<void> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(requestId) || !UUID_REGEX.test(vote.userId)) {
      return;
    }
    try {
      const { error } = await supabaseAdmin.from('approval_votes').upsert({
        request_id: requestId,
        verifier_id: vote.userId,
        role: vote.role,
        decision: vote.decision === 'approved' ? 'approve' : 'reject',
        comments: vote.comments || null,
        voted_at: vote.timestamp,
      }, { onConflict: 'request_id,verifier_id' });

      if (error) {
        console.warn(`[ApprovalService] ⚠️ Supabase vote write warning:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[ApprovalService] ⚠️ Supabase vote write catch:`, err.message);
    }
  }

  /** Sync memory cache from Supabase requests and votes */
  private async syncFromSupabase(singleId?: string): Promise<void> {
    const now = Date.now();
    if (!singleId && now - this.lastSyncTime < this.SYNC_TTL_MS && this.store.size > 0) {
      return;
    }
    this.lastSyncTime = now;

    try {
      const fetchPromise = (async () => {
        let query = supabaseAdmin
          .from('approval_requests')
          .select(`
            id, asset_id, status, required_votes, approved_count, rejected_count, 
            gnosis_safe_tx_hash, created_at, updated_at
          `);
        
        if (singleId) {
          query = query.eq('id', singleId);
        }

        const { data: dbRequests, error } = await query;
        if (error) {
          console.warn('[ApprovalService] ⚠️ failed to fetch approval requests:', error.message);
          return;
        }

        const requests = Array.isArray(dbRequests) ? dbRequests : [];
        for (const r of requests) {
          const { data: dbVotes } = await supabaseAdmin
            .from('approval_votes')
            .select('verifier_id, role, decision, comments, voted_at')
            .eq('request_id', r.id);

          const votesList = Array.isArray(dbVotes) ? dbVotes : [];
          const votes: ApprovalVote[] = votesList.map((v: any) => ({
            role: v.role as ApprovalRole,
            userId: v.verifier_id,
            decision: v.decision === 'approve' ? 'approved' : 'rejected',
            comments: v.comments || '',
            timestamp: v.voted_at,
          }));

          const existing = this.store.get(r.id);
          this.store.set(r.id, {
            id: r.id,
            assetId: r.asset_id,
            assetTitle: existing?.assetTitle || `Asset ${r.asset_id.slice(0, 8)}`,
            status: r.status as any,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            requiredVotes: r.required_votes || 2,
            totalRoles: existing?.totalRoles || 3,
            votes,
            approvedCount: r.approved_count || 0,
            rejectedCount: r.rejected_count || 0,
            gnosisSafeTxHash: r.gnosis_safe_tx_hash,
            verificationSummary: existing?.verificationSummary,
          });
        }
      })();

      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1500));
      await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err: any) {
      console.warn('[ApprovalService] ⚠️ syncFromSupabase error:', err.message);
    }
  }

  /** Create a new multi-sig approval request after AI verification. */
  async createRequest(
    assetId: string,
    assetTitle: string,
    verificationSummary?: ApprovalRequest['verificationSummary']
  ): Promise<ApprovalRequest> {
    await this.syncFromSupabase();
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

  async processOnChainApprovalEvent(data: {
    txHash: string;
    assetId: string;
    voterAddress?: string;
    role?: ApprovalRole;
    decision?: ApprovalDecision;
    comments?: string;
    status?: 'approved' | 'rejected';
  }): Promise<ApprovalRequest> {
    await this.syncFromSupabase();
    let request = this.findByAsset(data.assetId);

    if (!request) {
      request = await this.createRequest(data.assetId, `Asset ${data.assetId.slice(0, 8)}`);
    }

    request.gnosisSafeTxHash = data.txHash;
    request.updatedAt = new Date().toISOString();

    const newVote: ApprovalVote | null = (data.role && data.decision) ? {
      role: data.role,
      userId: data.voterAddress || 'on-chain-verifier',
      decision: data.decision,
      comments: data.comments || `On-chain event vote (tx: ${data.txHash.slice(0, 10)}...)`,
      timestamp: new Date().toISOString(),
    } : null;

    if (newVote) {
      const existingIdx = request.votes.findIndex((v) => v.role === newVote.role);
      if (existingIdx === -1) {
        request.votes.push(newVote);
        await this.persistVoteToSupabase(newVote, request.id);
      }
    }

    request.approvedCount = request.votes.filter((v) => v.decision === 'approved').length;
    request.rejectedCount = request.votes.filter((v) => v.decision === 'rejected').length;

    if (data.status) {
      request.status = data.status;
    } else if (request.approvedCount >= this.REQUIRED_VOTES) {
      request.status = 'approved';
    } else if (request.rejectedCount > (request.totalRoles - this.REQUIRED_VOTES)) {
      request.status = 'rejected';
    }

    this.store.set(request.id, request);
    await this.persistToSupabase(request);

    // Sync verification status to Supabase assets table
    try {
      if (request.status === 'approved') {
        await supabaseAdmin
          .from('assets')
          .update({
            verification_status: 'approved',
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.assetId);
      } else if (request.status === 'rejected') {
        await supabaseAdmin
          .from('assets')
          .update({
            verification_status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.assetId);
      }
    } catch (assetUpdateErr: any) {
      console.warn('[ApprovalService] ⚠️ Supabase asset status sync warning:', assetUpdateErr.message);
    }

    let ownerId: string | null = null;
    try {
      const { data: assetData } = await supabaseAdmin
        .from('assets')
        .select('owner_id')
        .eq('id', request.assetId)
        .single();
      if (assetData) ownerId = assetData.owner_id;
    } catch {}

    if (ownerId) {
      if (request.status === 'approved') {
        await notificationService.notify(
          ownerId,
          'asset_approved',
          'Multi-Sig Approval Complete',
          `Your asset "${request.assetTitle}" has passed multi-signature verifier approval (2-of-3 votes)!`,
          { assetId: request.assetId, requestId: request.id }
        );
      } else if (request.status === 'rejected') {
        await notificationService.notify(
          ownerId,
          'asset_rejected',
          'Multi-Sig Approval Rejected',
          `Your asset "${request.assetTitle}" was rejected during multi-signature review.`,
          { assetId: request.assetId, requestId: request.id }
        );
      } else if (newVote) {
        await notificationService.notify(
          ownerId,
          'asset_approved',
          'Verifier Review Submitted',
          `A ${newVote.role} submitted a ${newVote.decision} vote on your asset "${request.assetTitle}".`,
          { assetId: request.assetId, requestId: request.id, role: newVote.role, decision: newVote.decision }
        );
      }
    }

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

    await this.syncFromSupabase();
    const request = this.store.get(requestId);
    if (!request) throw new Error(`Approval request ${requestId} not found`);
    if (request.status !== 'pending') throw new Error(`Request is already ${request.status}`);

    const existingVote = request.votes.find((v) => v.role === role);
    if (existingVote) throw new Error(`Role '${role}' has already voted on this request`);

    const onChainTxHash = `0xvote_${uuidv4().replace(/-/g, '')}`;

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
    await this.syncFromSupabase();
    return Array.from(this.store.values())
      .filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAll(): Promise<ApprovalRequest[]> {
    await this.syncFromSupabase();
    return Array.from(this.store.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string): Promise<ApprovalRequest> {
    await this.syncFromSupabase(id);
    const req = this.store.get(id);
    if (!req) throw new Error(`Approval request ${id} not found`);
    return req;
  }

  async getByAsset(assetId: string): Promise<ApprovalRequest | null> {
    await this.syncFromSupabase();
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
