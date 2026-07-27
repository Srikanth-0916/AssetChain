/**
 * VectorStore — in-memory semantic document store.
 *
 * Stores embeddings + metadata, supports similarity search.
 * Swap backing to ChromaDB by setting CHROMA_URL in .env.
 */

import { embed, cosineSimilarity } from './embedding.service';

export interface VectorDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  text: string;
  metadata: Record<string, any>;
  score: number;
}

export class VectorStore {
  private readonly documents = new Map<string, VectorDocument>();

  /**
   * Upsert a document — generates embedding and stores it.
   * Safe to call with the same ID multiple times (updates existing).
   */
  async upsert(id: string, text: string, metadata: Record<string, any> = {}): Promise<void> {
    const embedding = await embed(text);
    this.documents.set(id, { id, text, metadata, embedding });
  }

  /**
   * Batch upsert — more efficient for indexing multiple documents.
   */
  async upsertBatch(docs: Array<{ id: string; text: string; metadata?: Record<string, any> }>): Promise<void> {
    await Promise.all(
      docs.map((doc) => this.upsert(doc.id, doc.text, doc.metadata || {}))
    );
  }

  /**
   * Semantic search — returns top-K most similar documents.
   */
  async search(query: string, topK = 5, minScore = 0.1): Promise<SearchResult[]> {
    if (this.documents.size === 0) return [];

    const queryEmbedding = await embed(query);

    const scored: Array<SearchResult & { rawScore: number }> = [];
    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      if (score >= minScore) {
        scored.push({ id: doc.id, text: doc.text, metadata: doc.metadata, score, rawScore: score });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ rawScore: _, ...rest }) => rest);
  }

  /** Remove a document by ID. */
  delete(id: string): void {
    this.documents.delete(id);
  }

  get size(): number {
    return this.documents.size;
  }
}

/** Singleton vector store used across the platform. */
export const vectorStore = new VectorStore();
