import { Router } from 'express';
import { marketplaceController } from '../controllers/marketplace.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validator';
import { buyTokensSchema } from '../utils/validators';

const router = Router();

router.post(
  '/buy',
  authenticate,
  roleGuard('investor', 'asset_owner'),
  validate(buyTokensSchema),
  marketplaceController.buyPrimaryTokens
);

export default router;
