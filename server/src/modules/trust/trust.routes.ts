import { Router, Request, Response } from 'express';
import { trustScoreService } from './trust.service';

const router = Router();

/**
 * GET /api/v1/trust/:assetId
 * Returns the trust score report for a given asset.
 * Public endpoint — no authentication required (trust data is public).
 */
router.get('/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    if (!assetId || assetId.length < 3) {
      res.status(400).json({ error: 'Invalid asset ID' });
      return;
    }

    const assetIdStr = Array.isArray(assetId) ? assetId[0] : assetId;
    const report = await trustScoreService.calculateTrustScore(assetIdStr);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('[TrustScore] Error calculating trust score:', error.message);
    res.status(500).json({
      success: false,
      error: 'Trust score calculation failed',
      message: 'Data unavailable',
    });
  }
});

export default router;
