/**
 * Multi-Signature Approval Service — 2-of-3 approval workflow.
 *
 * Roles: verifier, legal_reviewer, admin
 * Policy: any 2 of the 3 roles must approve to trigger tokenization.
 * Full audit trail persisted in-memory (upgradeable to DB).
 */

import { v4 as uuidv4 } from 'uuid';

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
  verificationSummary?: {
    riskScore: number;
    recommendation: string;
    confidence: number;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ApprovalService {
  private readonly REQUIRED_VOTES = 2;
  private readonly store = new Map<string, ApprovalRequest>();

  /** Create a new multi-sig approval request after AI verification. */
  async createRequest(
    assetId: string,
    assetTitle: string,
    verificationSummary?: ApprovalRequest['verificationSummary']
  ): Promise<ApprovalRequest> {
    // Only one active request per asset
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

    this.store.set(request.id, request);
    return request;
  }

  /** Submit an approval/rejection vote. */
  async submitVote(
    requestId: string,
    role: ApprovalRole,
    userId: string,
    decision: ApprovalDecision,
    comments?: string
  ): Promise<ApprovalRequest> {
    const request = this.store.get(requestId);
    if (!request) throw new Error(`Approval request ${requestId} not found`);
    if (request.status !== 'pending') throw new Error(`Request is already ${request.status}`);

    // One vote per role
    const existingVote = request.votes.find((v) => v.role === role);
    if (existingVote) throw new Error(`Role '${role}' has already voted on this request`);

    // Cast vote
    const vote: ApprovalVote = {
      role,
      userId,
      decision,
      comments,
      timestamp: new Date().toISOString(),
    };
    request.votes.push(vote);
    request.updatedAt = new Date().toISOString();

    // Recount
    request.approvedCount = request.votes.filter((v) => v.decision === 'approved').length;
    request.rejectedCount = request.votes.filter((v) => v.decision === 'rejected').length;

    // Evaluate policy
    if (request.approvedCount >= this.REQUIRED_VOTES) {
      request.status = 'approved';
    } else if (request.rejectedCount > (request.totalRoles - this.REQUIRED_VOTES)) {
      // Can never reach 2 approvals
      request.status = 'rejected';
    }

    this.store.set(requestId, request);
    return request;
  }

  /** List all pending approval requests. */
  async getPending(): Promise<ApprovalRequest[]> {
    return Array.from(this.store.values())
      .filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /** List all requests (all statuses). */
  async getAll(): Promise<ApprovalRequest[]> {
    return Array.from(this.store.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /** Get a single request by ID. */
  async getById(id: string): Promise<ApprovalRequest> {
    const req = this.store.get(id);
    if (!req) throw new Error(`Approval request ${id} not found`);
    return req;
  }

  /** Get request by asset ID. */
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
