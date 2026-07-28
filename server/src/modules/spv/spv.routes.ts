import { Router } from 'express';
import { spvController } from './spv.controller';
import { authenticate, authorizeRole } from '../../middleware/auth';

const router = Router();

router.get('/asset/:assetId', spvController.getByAssetId);
router.post('/asset/:assetId', authenticate, authorizeRole('admin'), spvController.upsertSPV);
router.put('/asset/:assetId', authenticate, authorizeRole('admin'), spvController.upsertSPV);

export default router;
