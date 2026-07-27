import { Router } from 'express';
import { assetController } from '../controllers/asset.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validator';
import { createAssetSchema, assetStatusSchema } from '../utils/validators';

const router = Router();

// Public Marketplace
router.get('/', optionalAuth, assetController.getMarketplaceAssets);
router.get('/my', authenticate, roleGuard('asset_owner'), assetController.getMyAssets);
router.get('/:id', optionalAuth, assetController.getAssetById);

// Asset Owner Creation
router.post(
  '/',
  authenticate,
  roleGuard('asset_owner'),
  validate(createAssetSchema),
  assetController.createAsset
);

// Admin Approval & Tokenization
router.patch(
  '/:id/status',
  authenticate,
  roleGuard('admin'),
  validate(assetStatusSchema),
  assetController.updateAssetStatus
);

router.post(
  '/:id/tokenize',
  authenticate,
  roleGuard('admin'),
  assetController.tokenizeAsset
);

export default router;
