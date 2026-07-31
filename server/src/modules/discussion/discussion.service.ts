/**
 * Institutional Investor Intelligence Hub Service
 * 
 * Manages asset-specific discussion threads, verified investor comments,
 * role badge enforcement, reputation scoring, and AI moderation/summarization pipelines.
 */

import { DiscussionThread, DiscussionComment, UserBadge, InvestorReputation } from './discussion.types';
import { discussionModerationEngine } from './discussion.moderation';
import { discussionSummaryEngine } from './discussion.summary';

export class DiscussionService {
  private threads: Map<string, DiscussionThread> = new Map();
  private comments: Map<string, DiscussionComment[]> = new Map();
  private reputationMap: Map<string, InvestorReputation> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const thread1: DiscussionThread = {
      threadId: 'th-com-01',
      assetId: 'ast-com-01',
      title: 'BKC Prime Commercial Tower — Q3 Property Inspection & Occupancy Discussion',
      category: 'GENERAL',
      isOfficialAnnouncement: false,
      authorId: 'usr-investor-01',
      authorName: 'Rajesh Kumar',
      authorBadge: 'VERIFIED_INVESTOR',
      commentsCount: 3,
      upvotesCount: 18,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.threads.set(thread1.threadId, thread1);

    const comments1: DiscussionComment[] = [
      {
        commentId: 'cmt-101',
        threadId: 'th-com-01',
        assetId: 'ast-com-01',
        authorId: 'usr-investor-01',
        authorName: 'Rajesh Kumar',
        authorBadge: 'VERIFIED_INVESTOR',
        content: 'I visited BKC Commercial Tower yesterday. Physical occupancy is around 92%, and building maintenance is pristine.',
        likesCount: 12,
        isModerated: false,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        commentId: 'cmt-102',
        threadId: 'th-com-01',
        assetId: 'ast-com-01',
        authorId: 'usr-legal-02',
        authorName: 'Adv. Ananya Roy',
        authorBadge: 'LEGAL_REVIEWER',
        content: 'Legal review completed. Title deed is unencumbered and current commercial lease expires in 2028.',
        likesCount: 24,
        isModerated: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        commentId: 'cmt-103',
        threadId: 'th-com-01',
        assetId: 'ast-com-01',
        authorId: 'usr-admin-01',
        authorName: 'TrustChain Asset Management',
        authorBadge: 'ADMIN',
        content: 'Official Announcement: Q3 dividend distribution snapshot is scheduled for August 15th.',
        likesCount: 35,
        isModerated: false,
        createdAt: new Date().toISOString(),
      },
    ];

    this.comments.set(thread1.threadId, comments1);
  }

  /**
   * Creates a new discussion thread for an asset.
   */
  async createThread(params: {
    assetId: string;
    title: string;
    category?: DiscussionThread['category'];
    isOfficialAnnouncement?: boolean;
    authorId: string;
    authorName: string;
    authorBadge?: UserBadge;
  }): Promise<DiscussionThread> {
    const threadId = `th-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const thread: DiscussionThread = {
      threadId,
      assetId: params.assetId,
      title: params.title,
      category: params.category || 'GENERAL',
      isOfficialAnnouncement: params.isOfficialAnnouncement || false,
      authorId: params.authorId,
      authorName: params.authorName,
      authorBadge: params.authorBadge || 'VERIFIED_INVESTOR',
      commentsCount: 0,
      upvotesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.threads.set(threadId, thread);
    this.comments.set(threadId, []);

    return thread;
  }

  /**
   * Posts a comment to a thread with AI moderation.
   */
  async postComment(params: {
    threadId: string;
    assetId: string;
    authorId: string;
    authorName: string;
    authorBadge?: UserBadge;
    content: string;
  }): Promise<{ comment: DiscussionComment | null; moderation: any }> {
    // 1. Moderate comment via Gemini AI
    const moderation = await discussionModerationEngine.moderateComment(params.content);

    if (!moderation.allowed) {
      return { comment: null, moderation };
    }

    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newComment: DiscussionComment = {
      commentId,
      threadId: params.threadId,
      assetId: params.assetId,
      authorId: params.authorId,
      authorName: params.authorName,
      authorBadge: params.authorBadge || 'VERIFIED_INVESTOR',
      content: params.content,
      likesCount: 0,
      isModerated: false,
      createdAt: new Date().toISOString(),
    };

    const threadComments = this.comments.get(params.threadId) || [];
    threadComments.push(newComment);
    this.comments.set(params.threadId, threadComments);

    // Update thread metadata
    const thread = this.threads.get(params.threadId);
    if (thread) {
      thread.commentsCount += 1;
      thread.updatedAt = new Date().toISOString();
    }

    return { comment: newComment, moderation };
  }

  /**
   * Gets all threads and comments for an asset.
   */
  async getAssetDiscussions(assetId: string) {
    const assetThreads = Array.from(this.threads.values()).filter((t) => t.assetId === assetId);

    const result = assetThreads.map((thread) => ({
      ...thread,
      comments: this.comments.get(thread.threadId) || [],
    }));

    return result;
  }

  /**
   * Generates AI summary & sentiment breakdown for an asset.
   */
  async getAssetAISummary(assetId: string) {
    const assetThreads = Array.from(this.threads.values()).filter((t) => t.assetId === assetId);
    let allComments: DiscussionComment[] = [];

    for (const thread of assetThreads) {
      const c = this.comments.get(thread.threadId) || [];
      allComments = allComments.concat(c);
    }

    return discussionSummaryEngine.generateSummary(assetId, allComments);
  }

  /**
   * Upvotes a comment and rewards author reputation.
   */
  async upvoteComment(commentId: string, threadId: string): Promise<DiscussionComment | null> {
    const commentsList = this.comments.get(threadId);
    if (!commentsList) return null;

    const comment = commentsList.find((c) => c.commentId === commentId);
    if (!comment) return null;

    comment.likesCount += 1;

    // Update author reputation
    const rep = this.getReputation(comment.authorId);
    rep.upvotesReceived += 1;
    rep.reputationScore += 5;
    if (rep.reputationScore >= 100) rep.tier = 'INSTITUTIONAL_LEAD';
    else if (rep.reputationScore >= 50) rep.tier = 'EXPERT_INVESTOR';
    else if (rep.reputationScore >= 20) rep.tier = 'CONTRIBUTOR';

    return comment;
  }

  /**
   * Gets investor reputation profile.
   */
  getReputation(userId: string): InvestorReputation {
    if (!this.reputationMap.has(userId)) {
      this.reputationMap.set(userId, {
        userId,
        reputationScore: 25,
        verifiedInvestorBadge: true,
        helpfulAnswersCount: 4,
        accuratePredictionsCount: 2,
        upvotesReceived: 12,
        tier: 'CONTRIBUTOR',
      });
    }
    return this.reputationMap.get(userId)!;
  }
}

export const discussionService = new DiscussionService();
