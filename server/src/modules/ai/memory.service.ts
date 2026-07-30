/**
 * ConversationMemoryService — per-user conversation history and investment preferences.
 *
 * Architecture:
 *  - In-memory LRU Map (immediate, zero infrastructure)
 *  - All public methods are async to allow transparent Redis upgrade later
 *  - Max 20 turns per user, 100 users in memory before LRU eviction
 */

import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../config/database';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../utils/errors';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationTurn {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  /** The AI response data object (structured JSON), if role === 'assistant' */
  data?: Record<string, any>;
}

export interface UserPreferences {
  budget: number;
  riskPreference: 'low' | 'medium' | 'high';
  preferredAssetTypes: string[];
  previousRecommendations: string[];
  investmentGoal: string;
  updatedAt: string;
}

interface UserMemory {
  history: ConversationTurn[];
  preferences: UserPreferences;
  lastActive: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  budget: 10000,
  riskPreference: 'medium',
  preferredAssetTypes: [],
  previousRecommendations: [],
  investmentGoal: 'balanced growth',
  updatedAt: new Date().toISOString(),
};

const MAX_HISTORY_PER_USER = 20;
const MAX_USERS_IN_MEMORY = 200;

// ─── Service ──────────────────────────────────────────────────────────────────

export class ConversationMemoryService {
  /** LRU-style map: userId → UserMemory */
  private readonly store = new Map<string, UserMemory>();

  // ── Private helpers ────────────────────────────────────────────────────────

  private getOrCreate(userId: string): UserMemory {
    if (!this.store.has(userId)) {
      if (this.store.size >= MAX_USERS_IN_MEMORY) {
        // Evict least recently active user
        let oldestKey: string | null = null;
        let oldestTime = Infinity;
        for (const [key, mem] of this.store.entries()) {
          if (mem.lastActive < oldestTime) {
            oldestTime = mem.lastActive;
            oldestKey = key;
          }
        }
        if (oldestKey) this.store.delete(oldestKey);
      }
      this.store.set(userId, {
        history: [],
        preferences: { ...DEFAULT_PREFERENCES },
        lastActive: Date.now(),
      });
    }
    const mem = this.store.get(userId)!;
    mem.lastActive = Date.now();
    return mem;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Add a turn to the user's conversation history. */
  async addTurn(
    userId: string,
    role: MessageRole,
    content: string,
    data?: Record<string, any>
  ): Promise<ConversationTurn> {
    const mem = this.getOrCreate(userId);
    const turn: ConversationTurn = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date().toISOString(),
      data,
    };
    mem.history.push(turn);
    // Trim to last N turns
    if (mem.history.length > MAX_HISTORY_PER_USER) {
      mem.history = mem.history.slice(-MAX_HISTORY_PER_USER);
    }

    // Skip Supabase write if user_id is not a valid UUID (e.g. test fixture IDs like "user-123")
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(userId)) {
      return turn; // Memory store is sufficient for non-UUID IDs
    }

    try {
      const { error } = await supabaseAdmin.from('ai_memory').insert({
        id: turn.id,
        user_id: userId,
        conversation_id: `session_${userId}`,   // stable per-user conversation namespace
        role: turn.role,
        content: turn.content,
        // 'data' and 'timestamp' columns may not exist in older DB deployments
        // Store structured data in 'metadata' JSONB which always exists
        metadata: {
          data: turn.data ?? {},
          timestamp: turn.timestamp,
        },
      });

      if (error) {
        if (env.NODE_ENV === 'production') {
          console.error(`[ConversationMemoryService] 🚨 CRITICAL PROD FAILURE: AI Memory persistence failed for ${userId}:`, error.message);
          throw new ServiceUnavailableError(`AI Memory persistence failure: ${error.message}`);
        } else {
          console.warn(`[ConversationMemoryService] ⚠️ Dev Mode Warning: Supabase write failed for AI memory:`, error.message);
        }
      }
    } catch (err: any) {
      if (env.NODE_ENV === 'production') {
        throw err instanceof ServiceUnavailableError ? err : new ServiceUnavailableError(`AI memory store failure: ${err.message}`);
      }
    }

    return turn;
  }

  /** Get the full conversation history for a user. */
  async getHistory(userId: string): Promise<ConversationTurn[]> {
    return this.getOrCreate(userId).history;
  }

  /** Clear conversation history but retain preferences. */
  async clearHistory(userId: string): Promise<void> {
    const mem = this.getOrCreate(userId);
    mem.history = [];
  }

  /** Save or update investment preferences. */
  async setPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const mem = this.getOrCreate(userId);
    mem.preferences = {
      ...mem.preferences,
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    return mem.preferences;
  }

  /** Get investment preferences with defaults. */
  async getPreferences(userId: string): Promise<UserPreferences> {
    return this.getOrCreate(userId).preferences;
  }

  /**
   * Build a context string that gets injected at the top of every Gemini prompt.
   * Includes the last 6 turns of history + user preferences.
   */
  async buildMemoryContext(userId: string): Promise<string> {
    const mem = this.getOrCreate(userId);
    const { history, preferences } = mem;

    const recentHistory = history.slice(-6);
    const historyText = recentHistory.length > 0
      ? recentHistory
          .map((t) => `${t.role.toUpperCase()}: ${t.content.slice(0, 300)}`)
          .join('\n')
      : 'No previous conversation.';

    return `
USER MEMORY CONTEXT:
- Budget: $${preferences.budget.toLocaleString()} USD
- Risk Preference: ${preferences.riskPreference.toUpperCase()}
- Investment Goal: ${preferences.investmentGoal}
- Preferred Asset Types: ${preferences.preferredAssetTypes.join(', ') || 'No preference'}
- Previous Recommendations Seen: ${preferences.previousRecommendations.slice(-3).join(', ') || 'None'}

RECENT CONVERSATION (last ${recentHistory.length} turns):
${historyText}
`.trim();
  }

  /** Track that a recommendation was shown to avoid repeating. */
  async trackRecommendation(userId: string, assetName: string): Promise<void> {
    const mem = this.getOrCreate(userId);
    if (!mem.preferences.previousRecommendations.includes(assetName)) {
      mem.preferences.previousRecommendations.push(assetName);
      // Keep last 20
      if (mem.preferences.previousRecommendations.length > 20) {
        mem.preferences.previousRecommendations = mem.preferences.previousRecommendations.slice(-20);
      }
    }
  }
}

export const memoryService = new ConversationMemoryService();
