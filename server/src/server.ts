import { createApp } from './app';
import { env } from './config/env';
import { indexPlatformKnowledge } from './modules/rag/knowledge.indexer';

const app = createApp();
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, async () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║       TrustChain AI API Server                ║
  ╠═══════════════════════════════════════════════╣
  ║  Environment:  ${env.NODE_ENV.padEnd(30)}║
  ║  Port:         ${String(PORT).padEnd(30)}║
  ║  Version:      ${env.APP_VERSION.padEnd(30)}║
  ║  API Base:     /api/v1${' '.repeat(23)}║
  ║  Health:       /api/v1/health${' '.repeat(16)}║
  ║  AI Copilot:   ${(env.GEMINI_API_KEY ? 'Live (Gemini)' : 'Mock Mode').padEnd(30)}║
  ╚═══════════════════════════════════════════════╝
  `);

  // Background: index knowledge base for RAG (non-blocking)
  indexPlatformKnowledge()
    .then(({ documents }) => console.log(`[RAG] Knowledge base ready: ${documents} documents indexed`))
    .catch((err) => console.warn('[RAG] Background indexing failed:', err.message));
});

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
