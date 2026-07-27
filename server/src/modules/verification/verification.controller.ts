import { Request, Response, NextFunction } from 'express';
import { ocrService } from './ocr.service';
import { fraudService } from './fraud.service';
import { valuationService } from './valuation.service';
import { duplicateService } from './duplicate.service';
import { assetService } from '../../services/asset.service';
import { sendSuccess } from '../../utils/response';

export class VerificationController {
  /**
   * POST /verification/analyze
   * Full AI verification pipeline: OCR → Fraud → Valuation → Duplicate
   */
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const { asset_id, ipfs_cid } = req.body;

      // 1. Get asset data
      let assetData: any = null;
      if (asset_id) {
        assetData = await assetService.getAssetById(asset_id).catch(() => null);
      }

      if (!assetData && !ipfs_cid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'asset_id or ipfs_cid is required' },
        });
      }

      const title = assetData?.title || 'Unknown Asset';
      const description = assetData?.description || '';
      const assetType = assetData?.asset_type || 'commercial_property';
      const location = assetData?.location || 'Unknown';
      const valuation = assetData?.valuation || 0;
      const tokenSupply = assetData?.token_supply || 1;

      // 2. Run pipeline in parallel
      const [documentFields, fraudReport, valuationReport, duplicateResult] = await Promise.all([
        ocrService.extractFromCid(ipfs_cid || `auto-${asset_id}`),
        fraudService.analyzeAsset({ title, description, assetType, location, valuation, tokenSupply, documentFields: {} }),
        valuationService.estimateValuation(assetType, location, valuation),
        duplicateService.checkForDuplicates(title, location, valuation),
      ]);

      // 3. Compute overall score
      const overallRiskScore = Math.round(
        fraudReport.fraudScore * 0.5 +
        (valuationReport.valuationStatus !== 'Reasonable' ? 20 : 0) +
        (duplicateResult.isDuplicate ? 40 : 0)
      );

      const overallRecommendation =
        overallRiskScore < 20 ? 'Approve' :
        overallRiskScore < 50 ? 'Manual Review' : 'Reject';

      sendSuccess(res, {
        assetId: asset_id,
        analyzedAt: new Date().toISOString(),
        overallRiskScore,
        overallRecommendation,
        pipeline: {
          ocr: { status: 'completed', extractedFields: documentFields },
          fraud: fraudReport,
          valuation: valuationReport,
          duplicate: duplicateResult,
        },
        summary: `AI verification complete. Overall risk score: ${overallRiskScore}/100. Recommendation: ${overallRecommendation}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /verification/fraud-check
   * Quick fraud check on asset title/description (image duplicate detection simulation).
   */
  async fraudCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, asset_type, location, valuation, token_supply } = req.body;
      const report = await fraudService.analyzeAsset({
        title: title || '',
        description: description || '',
        assetType: asset_type || 'commercial_property',
        location: location || '',
        valuation: Number(valuation) || 0,
        tokenSupply: Number(token_supply) || 1,
        documentFields: {},
      });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export const verificationController = new VerificationController();
