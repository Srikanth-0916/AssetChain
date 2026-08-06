import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { env } from '../config/env';

/**
 * Global error handling middleware.
 * Catches all errors and returns standardized error responses.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle known application errors
  if (err instanceof AppError) {
    if (env.NODE_ENV === 'development' && err.statusCode >= 500) {
      console.error('[ServerError]', err);
    } else if (env.NODE_ENV === 'development') {
      console.warn(`[${err.statusCode}] ${_req.method} ${_req.originalUrl} - ${err.message}`);
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodErr = err as any;
    const details = zodErr.errors?.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data', details);
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid JSON in request body');
    return;
  }

  // Handle multer file size errors
  if (err.message === 'File too large') {
    sendError(res, 400, 'VALIDATION_ERROR', 'File size exceeds the maximum allowed size');
    return;
  }

  // Unhandled errors - don't leak details in production
  const message =
    env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred';
  sendError(res, 500, 'INTERNAL_ERROR', message);
}
