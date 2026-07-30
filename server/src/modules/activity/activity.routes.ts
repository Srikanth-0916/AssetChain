/**
 * Activity Routes — GET /api/v1/activity
 *
 * Returns unified activity feed (blockchain events + audit log).
 * Supports: ?category=investment&page=1&limit=50&search=
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { activityService } from './activity.service';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.use(authenticate);

/**
 * GET /activity
 * Query params:
 *   category  - investment | token_mint | dao_vote | treasury_claim | marketplace | asset_approval | kyc | nominee | system
 *   page      - page number (default: 1)
 *   limit     - items per page (default: 50, max: 200)
 *   search    - free text search across title, subtitle, txHash, assetName
 */
router.get('/', (req: Request, res: Response) => {
  const { category, page, limit, search } = req.query;

  const result = activityService.getActivityFeed({
    category: category as any,
    userId: req.user!.userId,
    page: page ? parseInt(String(page), 10) : 1,
    limit: Math.min(200, limit ? parseInt(String(limit), 10) : 50),
    search: search ? String(search) : undefined,
  });

  sendSuccess(res, result);
});

/**
 * GET /activity/stats — Summary counts for the stat cards
 */
router.get('/stats', (_req: Request, res: Response) => {
  sendSuccess(res, activityService.getStats());
});

export default router;
