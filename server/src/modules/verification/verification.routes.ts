import { Router } from 'express';
import { verificationController } from './verification.controller';
import { authenticate } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';
import { landRegistryService } from './land.registry.service';
import { dueDiligenceRoomService } from './due.diligence.room.service';

const router = Router();

// Land Registry Property Verification (Public / Sandbox access allowed)
router.post('/land-registry/check', async (req, res, next) => {
  try {
    const result = await landRegistryService.verifyProperty(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Institutional Due Diligence Data Room & Asset Lifecycle Timeline
router.get('/data-room/:assetId', async (req, res, next) => {
  try {
    const dataRoom = await dueDiligenceRoomService.getDataRoom(req.params.assetId);
    res.json({ success: true, data: dataRoom });
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);

// Full AI verification pipeline (admin only)
router.post('/analyze', roleGuard('admin'), (req, res, next) =>
  verificationController.analyze(req, res, next)
);

// Quick fraud check
router.post('/fraud-check', roleGuard('admin'), (req, res, next) =>
  verificationController.fraudCheck(req, res, next)
);

export default router;
