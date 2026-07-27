import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import { sendCreated } from '../utils/response';

export class MarketplaceController {
  async buyPrimaryTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await marketplaceService.buyPrimaryTokens(req.user!.userId, req.body);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const marketplaceController = new MarketplaceController();
