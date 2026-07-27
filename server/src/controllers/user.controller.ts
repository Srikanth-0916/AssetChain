import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendPaginated } from '../utils/response';

/**
 * User controller handling HTTP endpoints for user management.
 */
export class UserController {
  /**
   * GET /users/me
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.user!.userId, {});
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /users/me
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /users/me/kyc
   */
  async submitKYC(req: Request, res: Response, next: NextFunction) {
    try {
      // For now, accept the document CID from the body
      // In production, files would be uploaded via multer → Pinata
      const { document_cid } = req.body;
      const result = await userService.submitKYC(req.user!.userId, document_cid);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users (Admin)
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { users, meta } = await userService.getUsers(req.query as any);
      sendPaginated(res, users, meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /users/:id/kyc (Admin)
   */
  async reviewKYC(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await userService.reviewKYC(
        userId,
        req.body,
        req.user!.userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /users/:id/suspend (Admin)
   */
  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await userService.suspendUser(
        userId,
        req.body,
        req.user!.userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
