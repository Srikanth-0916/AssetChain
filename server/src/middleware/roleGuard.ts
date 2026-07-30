import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

type UserRole = 'admin' | 'asset_owner' | 'investor' | 'verifier' | 'legal_reviewer';

/**
 * Role-based access control middleware factory.
 * Restricts route access to users with specified roles.
 *
 * @param allowedRoles - Roles permitted to access the route
 * @returns Express middleware function
 *
 * @example
 * router.get('/admin/users', authenticate, roleGuard('admin'), controller.getUsers);
 * router.get('/portfolio', authenticate, roleGuard('investor', 'asset_owner'), controller.getPortfolio);
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}

/**
 * Check if the authenticated user's KYC is approved.
 * Must be used after authenticate middleware.
 */
export function requireKYC(req: Request, _res: Response, next: NextFunction): void {
  // KYC check will be done at the service level by querying the database
  // This middleware serves as a placeholder — actual check in the service
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
}
