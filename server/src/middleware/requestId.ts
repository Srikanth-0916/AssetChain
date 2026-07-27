import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request { requestId: string; }
  }
}

/**
 * Attaches a unique x-request-id to every incoming request.
 * Used for distributed tracing and error correlation.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
