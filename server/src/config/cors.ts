import { CorsOptions } from 'cors';
import { env } from './env';

const configuredOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (env.NODE_ENV === 'development') return callback(null, true);
    if (configuredOrigins.includes(origin) || configuredOrigins.includes('*') || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(null, true); // Permissive in prototype mode
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  maxAge: 86400, // 24 hours
};
