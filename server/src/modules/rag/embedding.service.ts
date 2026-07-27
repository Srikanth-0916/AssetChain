/**
 * EmbeddingService — text embeddings using Gemini text-embedding-004.
 *
 * Falls back to a deterministic TF-IDF-style sparse vector when API unavailable.
 * This ensures RAG works in demo mode without any API keys.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

/** Vocabulary for sparse fallback embedding */
const VOCAB_TERMS = [
  'commercial', 'property', 'residential', 'real', 'estate', 'renewable', 'energy',
  'solar', 'farm', 'office', 'retail', 'apartment', 'luxury', 'industrial', 'warehouse',
  'invest', 'token', 'yield', 'return', 'risk', 'dividend', 'portfolio', 'diversify',
  'blockchain', 'polygon', 'smart', 'contract', 'ipfs', 'verification', 'kyc', 'audit',
  'dao', 'governance', 'vote', 'proposal', 'quorum', 'market', 'valuation', 'price',
  'buy', 'sell', 'trade', 'liquidity', 'inflation', 'hedge', 'income', 'passive',
  'dubai', 'mumbai', 'london', 'global', 'location', 'reit', 'fractional', 'ownership',
];

/**
 * Sparse TF-IDF-style embedding for fallback.
 * Returns a 64-dimensional float vector.
 */
function sparseEmbed(text: string): number[] {
  const lower = text.toLowerCase();
  const vector = VOCAB_TERMS.map((term) => {
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    const count = (lower.match(regex) || []).length;
    return count / (text.split(' ').length + 1);
  });
  // Normalize
  const mag = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => v / mag);
}

export async function embed(text: string): Promise<number[]> {
  if (!genAI) return sparseEmbed(text);
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text.slice(0, 2048));
    return result.embedding.values;
  } catch {
    return sparseEmbed(text);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  return magA === 0 || magB === 0 ? 0 : dot / (magA * magB);
}
