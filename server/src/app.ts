import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { env } from './config/env';
import routes from './routes';

/**
 * Create and configure the Express application.
 * Module 12: Added requestId, structured logging format, compression header advice.
 */
export function createApp() {
  const app = express();

  // ─── Request ID (Module 12) ───────────────────────────────────────────────
  app.use(requestIdMiddleware);

  // ─── Security Middleware ───────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors(corsOptions));

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  app.use(generalLimiter);

  // ─── Request Parsing ───────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Logging ───────────────────────────────────────────────────────────────
  // Combined format in production for log aggregators, dev format locally
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ─── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/v1', routes);

  // ─── 404 Handler ───────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      requestId: req.requestId,
      error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist' },
    });
  });

  // ─── Global Error Handler ──────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
