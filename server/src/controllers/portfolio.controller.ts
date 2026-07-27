import { Request, Response, NextFunction } from 'express';
import { portfolioService } from '../services/portfolio.service';
import { sendSuccess } from '../utils/response';

export class PortfolioController {
  async getPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolio = await portfolioService.getPortfolio(req.user!.userId);
      sendSuccess(res, portfolio);
    } catch (error) {
      next(error);
    }
  }
}

export const portfolioController = new PortfolioController();
