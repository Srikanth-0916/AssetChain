import { describe, it, expect } from 'vitest';
import { discussionService } from '../src/modules/discussion/discussion.service';
import { discussionModerationEngine } from '../src/modules/discussion/discussion.moderation';
import { assetComparisonService } from '../src/modules/analytics/asset.comparison.service';
import { dueDiligenceRoomService } from '../src/modules/verification/due.diligence.room.service';
import { evidenceVerificationService } from '../src/modules/discussion/evidence.verification';

describe('Institutional Investor Intelligence Hub Test Suite', () => {
  it('TC-DISC-1: Discussion Threads — Fetches asset-scoped threads with verified badges', async () => {
    const discussions = await discussionService.getAssetDiscussions('ast-com-01');

    expect(discussions.length).toBeGreaterThan(0);
    const thread = discussions[0];
    expect(thread.assetId).toBe('ast-com-01');
    expect(thread.comments.length).toBeGreaterThanOrEqual(3);

    const verifiedComment = thread.comments.find((c) => c.authorBadge === 'LEGAL_REVIEWER');
    expect(verifiedComment).toBeDefined();
    expect(verifiedComment?.authorName).toBe('Adv. Ananya Roy');
  });

  it('TC-DISC-2: AI Moderation — Blocks financial manipulation & pump-and-dump claims', async () => {
    const scamResult = await discussionModerationEngine.moderateComment('Buy immediately!! Guaranteed 300% return risk-free profit!');

    expect(scamResult.allowed).toBe(false);
    expect(scamResult.flagged).toBe(true);
    expect(scamResult.riskCategory).toBe('FINANCIAL_MANIPULATION');
    expect(scamResult.confidenceScore).toBeGreaterThanOrEqual(90);
  });

  it('TC-DISC-3: AI Moderation — Clears legitimate investor comments', async () => {
    const cleanResult = await discussionModerationEngine.moderateComment(
      'Property site visit confirmed 90%+ occupancy and clean common area maintenance.'
    );

    expect(cleanResult.allowed).toBe(true);
    expect(cleanResult.flagged).toBe(false);
    expect(cleanResult.riskCategory).toBe('CLEAN');
  });

  it('TC-DISC-4: Comment Posting — Rejects scam comments during thread post attempt', async () => {
    const thread = await discussionService.createThread({
      assetId: 'ast-sol-02',
      title: 'Solar Farm Yield Forecast Discussion',
      authorId: 'usr-inv-99',
      authorName: 'Vikram Mehta',
      authorBadge: 'VERIFIED_INVESTOR',
    });

    const postAttempt = await discussionService.postComment({
      threadId: thread.threadId,
      assetId: 'ast-sol-02',
      authorId: 'usr-scammer',
      authorName: 'Scam Bot',
      content: 'Guaranteed 500% ROI double your money in 2 days!',
    });

    expect(postAttempt.comment).toBeNull();
    expect(postAttempt.moderation.allowed).toBe(false);
  });

  it('TC-DISC-5: AI Discussion Summarizer — Generates bullet points, concerns & sentiment index', async () => {
    const summary = await discussionService.getAssetAISummary('ast-com-01');

    expect(summary.assetId).toBe('ast-com-01');
    expect(summary.sentimentIndex).toBeDefined();
    expect(summary.keyHighlights.length).toBeGreaterThan(0);
    expect(summary.primaryInvestorConcerns.length).toBeGreaterThan(0);
    expect(summary.frequentQuestions.length).toBeGreaterThan(0);
  });

  it('TC-DISC-6: Investor Reputation System — Increases reputation points on comment upvotes', async () => {
    const repBefore = discussionService.getReputation('usr-investor-01');
    const initialScore = repBefore.reputationScore;

    await discussionService.upvoteComment('cmt-101', 'th-com-01');

    const repAfter = discussionService.getReputation('usr-investor-01');
    expect(repAfter.reputationScore).toBe(initialScore + 5);
  });

  it('TC-DISC-7: Side-by-Side Asset Comparison — Compares assets on Yield, Trust Score, Risk & ESG', async () => {
    const comparison = await assetComparisonService.compareAssets(['ast-com-01', 'ast-sol-02']);

    expect(comparison.comparedAssetIds.length).toBe(2);
    expect(comparison.metrics.length).toBe(2);
    expect(comparison.topRecommendedAssetId).toBeDefined();
    expect(comparison.recommendationReason).toContain('yield');
  });

  it('TC-DISC-8: Due Diligence Data Room & Timeline — Returns verified documents & milestones', async () => {
    const room = await dueDiligenceRoomService.getDataRoom('ast-com-01');

    expect(room.assetId).toBe('ast-com-01');
    expect(room.spvName).toBe('TrustChain BKC SPV Ltd');
    expect(room.documents.length).toBeGreaterThanOrEqual(4);
    expect(room.timeline.length).toBeGreaterThanOrEqual(6);
    expect(room.documents[0].ipfsCid).toBeDefined();
  });

  it('TC-DISC-9: Verified Evidence Inspector — Verifies GPS proximity & timestamp authenticity', async () => {
    const result = await evidenceVerificationService.verifyEvidence({
      assetId: 'ast-com-01',
      gpsLatitude: 19.0657,
      gpsLongitude: 72.8686,
      capturedTimestamp: '2026-07-31T12:00:00Z',
    });

    expect(result.verified).toBe(true);
    expect(result.gpsLocationMatch).toBe(true);
    expect(result.distanceFromAssetMeters).toBeLessThan(100);
    expect(result.evidenceBadge).toBe('VERIFIED_SITE_INSPECTION');
  });
});
