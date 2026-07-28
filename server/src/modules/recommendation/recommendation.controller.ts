import { Request, Response, NextFunction } from 'express';
import { investmentRecommendationService } from './investmentRecommendation.service';

export class RecommendationController {
  async getRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'investor-demo-uuid-001';
      const { budget, currency = 'INR', risk_preference } = req.body;

      const result = await investmentRecommendationService.generateRecommendation(
        userId,
        budget ? Number(budget) : undefined,
        currency as 'INR' | 'USD',
        risk_preference as 'low' | 'medium' | 'high'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationController = new RecommendationController();
