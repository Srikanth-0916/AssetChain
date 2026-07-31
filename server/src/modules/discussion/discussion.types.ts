/**
 * Types & Interfaces for Institutional Investor Intelligence Hub & Asset Discussion Module
 */

export type UserBadge = 'ASSET_OWNER' | 'VERIFIED_INVESTOR' | 'LEGAL_REVIEWER' | 'AUDITOR' | 'ADMIN' | 'MEMBER';

export interface DiscussionComment {
  commentId: string;
  threadId: string;
  assetId: string;
  authorId: string;
  authorName: string;
  authorBadge: UserBadge;
  content: string;
  likesCount: number;
  isModerated: boolean;
  moderationReason?: string;
  createdAt: string;
}

export interface DiscussionThread {
  threadId: string;
  assetId: string;
  title: string;
  category: 'GENERAL' | 'ANNOUNCEMENT' | 'POLL' | 'AMA' | 'LEGAL_DUE_DILIGENCE';
  isOfficialAnnouncement: boolean;
  authorId: string;
  authorName: string;
  authorBadge: UserBadge;
  commentsCount: number;
  upvotesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationResult {
  allowed: boolean;
  flagged: boolean;
  riskCategory?: 'FINANCIAL_MANIPULATION' | 'PUMP_AND_DUMP' | 'SCAM_PHISHING' | 'ABUSIVE_LANGUAGE' | 'CLEAN';
  reason?: string;
  confidenceScore: number; // 0-100
}

export interface DiscussionSummary {
  assetId: string;
  totalCommentsAnalyzed: number;
  sentimentIndex: 'POSITIVE' | 'NEUTRAL' | 'CAUTIOUS' | 'NEGATIVE';
  positivePercentage: number;
  keyHighlights: string[];
  primaryInvestorConcerns: string[];
  frequentQuestions: string[];
  sourceCommentIds: string[];
  aiOverview: string;
  generatedAt: string;
}

export interface InvestorReputation {
  userId: string;
  reputationScore: number;
  verifiedInvestorBadge: boolean;
  helpfulAnswersCount: number;
  accuratePredictionsCount: number;
  upvotesReceived: number;
  tier: 'NOVICE' | 'CONTRIBUTOR' | 'EXPERT_INVESTOR' | 'INSTITUTIONAL_LEAD';
}
