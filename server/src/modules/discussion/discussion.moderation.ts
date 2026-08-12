/**
 * Gemini AI Discussion Moderation Engine
 * 
 * Inspects incoming investor posts & comments to prevent:
 * - Financial manipulation & fake return promises ("Guaranteed 300% return!")
 * - Pump-and-dump attempts ("Buy now immediately before 10x explosion!")
 * - Phishing links & external scams
 * - Abusive or inappropriate content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { ModerationResult } from './discussion.types';

export class DiscussionModerationEngine {
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.ai = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  /**
   * Moderates a comment using Gemini AI with fallback rules.
   */
  async moderateComment(content: string): Promise<ModerationResult> {
    const textLower = content.toLowerCase();

    // 1. Fast deterministic rule check for high-risk financial scams
    const financialScamPatterns = [
      /guaranteed\s+(?:100%|200%|300%|500%|\d+x)/i,
      /buy\s+immediately\s+before/i,
      /pump\s+and\s+dump/i,
      /easy\s+money\s+double/i,
      /risk-free\s+profit/i,
    ];

    for (const pattern of financialScamPatterns) {
      if (pattern.test(content)) {
        return {
          allowed: false,
          flagged: true,
          riskCategory: 'FINANCIAL_MANIPULATION',
          reason: 'Comment flagged: Unrealistic guaranteed financial return claim detected.',
          confidenceScore: 98,
        };
      }
    }

    // 2. Phishing Link Detection
    if (/(?:http|https):\/\/(?!trustchain|polygon|etherscan|supabase)/i.test(content)) {
      return {
        allowed: false,
        flagged: true,
        riskCategory: 'SCAM_PHISHING',
        reason: 'Comment flagged: External unverified link detected.',
        confidenceScore: 92,
      };
    }

    // 3. Gemini AI Detailed Inspection (if key available)
    if (this.ai) {
      try {
        const model = this.ai.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
        const prompt = `Analyze this user discussion comment for an investor community platform.
Determine if it contains financial manipulation, pump-and-dump claims, misleading investment advice, or abusive text.
Respond strictly in JSON format:
{
  "flagged": boolean,
  "riskCategory": "FINANCIAL_MANIPULATION" | "PUMP_AND_DUMP" | "SCAM_PHISHING" | "ABUSIVE_LANGUAGE" | "CLEAN",
  "reason": "short explanation",
  "confidenceScore": number
}

Comment: "${content}"`;

        const res = await model.generateContent(prompt);
        const text = res.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            allowed: !parsed.flagged,
            flagged: parsed.flagged,
            riskCategory: parsed.riskCategory || (parsed.flagged ? 'FINANCIAL_MANIPULATION' : 'CLEAN'),
            reason: parsed.reason || 'AI moderation policy evaluated.',
            confidenceScore: parsed.confidenceScore || 90,
          };
        }
      } catch {
        // Fallback to clean deterministic pass
      }
    }

    return {
      allowed: true,
      flagged: false,
      riskCategory: 'CLEAN',
      reason: 'Comment cleared moderation filters.',
      confidenceScore: 95,
    };
  }
}

export const discussionModerationEngine = new DiscussionModerationEngine();
