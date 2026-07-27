import { Request, Response, NextFunction } from 'express';
import { assetService } from '../services/asset.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';

export class AssetController {
  async createAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const asset = await assetService.createAsset(req.user!.userId, req.body);
      sendCreated(res, asset);
    } catch (error) {
      next(error);
    }
  }

  async getMarketplaceAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const { assets, meta } = await assetService.getMarketplaceAssets(req.query as any);
      sendPaginated(res, assets, meta);
    } catch (error) {
      next(error);
    }
  }

  async getMyAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const assets = await assetService.getMyAssets(req.user!.userId);
      sendSuccess(res, assets);
    } catch (error) {
      next(error);
    }
  }

  async getAssetById(req: Request, res: Response, next: NextFunction) {
    try {
      const asset = await assetService.getAssetById(req.params.id as string);
      sendSuccess(res, asset);
    } catch (error) {
      next(error);
    }
  }

  async updateAssetStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetService.updateAssetStatus(
        req.params.id as string,
        req.body,
        req.user!.userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async tokenizeAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetService.tokenizeAsset(
        req.params.id as string,
        req.body.contract_address,
        req.user!.userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const assetController = new AssetController();
