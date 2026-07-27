import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { approvalService, ApprovalRole, ApprovalDecision } from './approval.service';
import { sendSuccess } from '../../utils/response';

const voteSchema = z.object({
  request_id: z.string().uuid(),
  role: z.enum(['verifier', 'legal_reviewer', 'admin']),
  decision: z.enum(['approved', 'rejected']),
  comments: z.string().max(500).optional(),
});

const createSchema = z.object({
  asset_id: z.string(),
  asset_title: z.string(),
  verification_summary: z.object({
    riskScore: z.number(),
    recommendation: z.string(),
    confidence: z.number(),
  }).optional(),
});

export class ApprovalController {
  /** POST /approval/request */
  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      }
      const { asset_id, asset_title, verification_summary } = parsed.data;
      const request = await approvalService.createRequest(asset_id, asset_title, verification_summary);
      res.status(201).json({ success: true, data: request, message: 'Multi-signature approval request created' });
    } catch (error) { next(error); }
  }

  /** POST /approval/vote */
  async submitVote(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = voteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
      }
      const { request_id, role, decision, comments } = parsed.data;
      const updated = await approvalService.submitVote(
        request_id,
        role as ApprovalRole,
        req.user!.userId,
        decision as ApprovalDecision,
        comments
      );
      const msg = updated.status === 'approved'
        ? `Asset approved! ${updated.approvedCount}/${updated.requiredVotes} votes. Tokenization triggered.`
        : updated.status === 'rejected'
        ? 'Asset rejected by multi-sig consensus.'
        : `Vote recorded (${updated.approvedCount}/${updated.requiredVotes} approvals needed).`;
      res.json({ success: true, data: updated, message: msg });
    } catch (error) { next(error); }
  }

  /** GET /approval/pending */
  async getPending(req: Request, res: Response, next: NextFunction) {
    try {
      const pending = await approvalService.getPending();
      sendSuccess(res, { requests: pending, count: pending.length });
    } catch (error) { next(error); }
  }

  /** GET /approval */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const all = await approvalService.getAll();
      sendSuccess(res, { requests: all, count: all.length });
    } catch (error) { next(error); }
  }

  /** GET /approval/:id */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await approvalService.getById(String(req.params['id']));
      sendSuccess(res, request);
    } catch (error) { next(error); }
  }

  /** GET /approval/asset/:assetId */
  async getByAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await approvalService.getByAsset(String(req.params['assetId']));
      sendSuccess(res, request ?? { message: 'No approval request found for this asset' });
    } catch (error) { next(error); }
  }
}

export const approvalController = new ApprovalController();
