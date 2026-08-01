import { Router, Request, Response } from 'express';
import { discussionService } from './discussion.service';
import { discussionModerationEngine } from './discussion.moderation';
import { evidenceVerificationService } from './evidence.verification';

const router = Router();

/**
 * POST /api/v1/discussion/create
 * Creates a new asset-scoped discussion thread.
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const thread = await discussionService.createThread(req.body);
    res.json({ success: true, data: thread });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/discussion/:assetId
 * Retrieves all threads and verified comments for an asset.
 */
router.get('/:assetId', async (req: Request, res: Response) => {
  try {
    const assetId = Array.isArray(req.params.assetId) ? req.params.assetId[0] : req.params.assetId;
    const discussions = await discussionService.getAssetDiscussions(assetId);
    res.json({ success: true, data: discussions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/discussion/comment
 * Posts a comment with Gemini AI moderation check.
 */
router.post('/comment', async (req: Request, res: Response) => {
  try {
    const { comment, moderation } = await discussionService.postComment(req.body);
    if (!comment) {
      res.status(400).json({
        success: false,
        error: 'Comment rejected by AI moderation',
        moderation,
      });
      return;
    }
    res.json({ success: true, data: comment, moderation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/discussion/summary/:assetId
 * Generates AI thread summary & sentiment analysis.
 */
router.get('/summary/:assetId', async (req: Request, res: Response) => {
  try {
    const assetId = Array.isArray(req.params.assetId) ? req.params.assetId[0] : req.params.assetId;
    const summary = await discussionService.getAssetAISummary(assetId);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/discussion/verify-evidence
 * Validates uploaded photo evidence GPS proximity & timestamp authenticity.
 */
router.post('/verify-evidence', async (req: Request, res: Response) => {
  try {
    const result = await evidenceVerificationService.verifyEvidence(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/discussion/moderate
 * Test endpoint to evaluate content via AI moderation engine.
 */
router.post('/moderate', async (req: Request, res: Response) => {
  try {
    const result = await discussionModerationEngine.moderateComment(req.body.content || '');
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/discussion/like
 * Upvotes a comment and updates author reputation.
 */
router.post('/like', async (req: Request, res: Response) => {
  try {
    const { commentId, threadId } = req.body;
    const comment = await discussionService.upvoteComment(commentId, threadId);
    res.json({ success: true, data: comment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/discussion/reputation/:userId
 * Retrieves investor reputation profile & badge tier.
 */
router.get('/reputation/:userId', (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const rep = discussionService.getReputation(userId);
  res.json({ success: true, data: rep });
});

export default router;
