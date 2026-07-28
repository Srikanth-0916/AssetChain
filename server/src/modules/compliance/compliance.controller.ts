import { Request, Response } from 'express';
import { complianceService } from './compliance.service';

export class ComplianceController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await complianceService.getProfile(id);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await complianceService.updateComplianceProfile(id, req.body, (req as any).user?.id);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const complianceController = new ComplianceController();
