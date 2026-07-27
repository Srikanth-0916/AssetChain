import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * Create and configure the Express application.
 */
export function createApp() {
  const app = express();

  // ─── Security Middleware ───
  app.use(helmet());
  app.use(cors(corsOptions));

  // ─── Rate Limiting ───
  app.use(generalLimiter);

  // ─── Request Parsing ───
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Logging ───
  app.use(morgan('dev'));

  // ─── API Routes ───
  app.use('/api/v1', routes);

  // ─── 404 Handler ───
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
      },
    });
  });

  // ─── Global Error Handler ───
  app.use(errorHandler);

  return app;
}
