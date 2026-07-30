import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { walletService } from '../services/wallet.service';
import { sendSuccess, sendCreated } from '../utils/response';

/**
 * Authentication controller handling HTTP request/response for auth endpoints.
 */
export class AuthController {
  /**
   * POST /auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   */
  async logout(_req: Request, res: Response, _next: NextFunction) {
    // JWT is stateless — client simply discards the token.
    // For token blacklisting, implement a Redis-based blocklist.
    sendSuccess(res, { message: 'Logged out successfully' });
  }

  /**
   * POST /auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, new_password } = req.body;
      const result = await authService.resetPassword(token, new_password);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getUserById(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/wallet/public-nonce
   * Public (unauthenticated) nonce generation for wallet-first login/registration.
   */
  async publicWalletNonce(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await walletService.generatePublicNonce(req.body.wallet_address);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/wallet/login
   * Public (unauthenticated) wallet login/registration via off-chain EIP-191 signature.
   */
  async publicWalletLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet_address, signature, role } = req.body;
      const result = await walletService.loginWithWallet(wallet_address, signature, role);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/wallet/nonce
   */
  async walletNonce(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await walletService.generateNonce(
        req.body.wallet_address,
        req.user!.userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/wallet/verify
   */
  async walletVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await walletService.verifyWallet(
        req.body.wallet_address,
        req.body.signature,
        req.user!.userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
