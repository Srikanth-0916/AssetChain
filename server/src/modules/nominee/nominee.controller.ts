import { Request, Response } from 'express';
import { nomineeService } from './nominee.service';

export class NomineeController {
  async getNominee(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.params.userId;
      const nominee = await nomineeService.getNominee(userId);
      res.json({ success: true, data: nominee });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async setNominee(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId || 'investor-demo-uuid-001';
      const nominee = await nomineeService.setNominee(userId, req.body);
      res.json({ success: true, data: nominee });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteNominee(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.params.userId;
      await nomineeService.deleteNominee(userId);
      res.json({ success: true, message: 'Nominee removed successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async submitClaim(req: Request, res: Response): Promise<void> {
    try {
      const claim = await nomineeService.submitInheritanceClaim(req.body);
      res.json({ success: true, data: claim });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllClaims(req: Request, res: Response): Promise<void> {
    try {
      const claims = await nomineeService.getAllClaims();
      res.json({ success: true, data: claims });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyClaim(req: Request, res: Response): Promise<void> {
    try {
      const { claimId } = req.params;
      const { verified, notes } = req.body;
      const claim = await nomineeService.verifyClaim(claimId, verified, notes, (req as any).user?.id);
      res.json({ success: true, data: claim });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async executeTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { claimId } = req.params;
      const claim = await nomineeService.executeInheritanceTransfer(claimId, (req as any).user?.id);
      res.json({ success: true, data: claim });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const nomineeController = new NomineeController();
