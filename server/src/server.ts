import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║         AssetChain API Server                 ║
  ╠═══════════════════════════════════════════════╣
  ║  Environment:  ${env.NODE_ENV.padEnd(30)}║
  ║  Port:         ${String(PORT).padEnd(30)}║
  ║  API Base:     /api/v1${' '.repeat(23)}║
  ║  Health:       /api/v1/health${' '.repeat(16)}║
  ╚═══════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
