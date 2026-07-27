/**
 * RAGService — retrieval-augmented generation context builder.
 *
 * Searches the vector store for relevant documents and formats them
 * into a context string injected into every AI prompt.
 */

import { vectorStore } from './vector.store';
import { indexPlatformKnowledge, isKnowledgeIndexed } from './knowledge.indexer';

export class RAGService {
  /**
   * Retrieve top-K relevant documents for a query.
   * Returns formatted context string for prompt injection.
   */
  async retrieveContext(query: string, topK = 4): Promise<string> {
    // Lazy index on first call if not yet indexed
    if (!isKnowledgeIndexed()) {
      await indexPlatformKnowledge();
    }

    const results = await vectorStore.search(query, topK, 0.05);

    if (results.length === 0) {
      return 'No specific platform documents retrieved for this query.';
    }

    const formatted = results.map((r, i) => {
      const meta = r.metadata;
      const typeLabel = meta.type === 'asset' ? '📊 ASSET DATA'
        : meta.type === 'proposal' ? '🗳️ DAO PROPOSAL'
        : '📚 PLATFORM KNOWLEDGE';
      return `[${i + 1}] ${typeLabel} (relevance: ${(r.score * 100).toFixed(0)}%)\n${r.text}`;
    }).join('\n\n');

    return `RETRIEVED PLATFORM KNOWLEDGE (do NOT hallucinate beyond this data):\n\n${formatted}`;
  }

  /** Re-index all platform data (call after asset approval, etc.) */
  async reindex(): Promise<{ documents: number; status: string }> {
    return indexPlatformKnowledge();
  }
}

export const ragService = new RAGService();
