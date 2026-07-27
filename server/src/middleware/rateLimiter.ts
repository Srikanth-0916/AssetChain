import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 120 requests per minute for authenticated users.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoint rate limiter — 10 requests per minute.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter — 5 requests per minute.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many upload attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
