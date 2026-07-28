import { Request, Response } from 'express';
import { spvService } from './spv.service';

export class SPVController {
  async getByAssetId(req: Request, res: Response): Promise<void> {
    try {
      const assetId = req.params.assetId as string;
      const spv = await spvService.getByAssetId(assetId);
      res.json({ success: true, data: spv });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async upsertSPV(req: Request, res: Response): Promise<void> {
    try {
      const assetId = req.params.assetId as string;
      const spv = await spvService.upsertSPV(assetId, req.body);
      res.json({ success: true, data: spv });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const spvController = new SPVController();
