import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

/**
 * JWT payload interface.
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'asset_owner' | 'investor';
  walletAddress?: string;
}

/**
 * Extend Express Request to include authenticated user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT authentication middleware.
 * Validates the Bearer token from the Authorization header.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No authentication token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Authentication token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid authentication token');
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Optional authentication - attaches user if token present, continues if not.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = decoded;
  } catch {
    // Token invalid but optional - continue without user
  }

  next();
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}
