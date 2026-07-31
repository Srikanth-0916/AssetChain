import { Router } from 'express';
import { complianceController } from './compliance.controller';
import { authenticate, authorizeRole } from '../../middleware/auth';
import { identityService } from './identity.service';
import { regulatoryReportService } from './regulatory.report.service';

const router = Router();

router.get('/profile/:id', complianceController.getProfile);
router.post('/whitelist', authenticate, authorizeRole('admin'), complianceController.updateProfile);
router.put('/profile/:id', authenticate, authorizeRole('admin'), complianceController.updateProfile);

// Enterprise KYC & Identity Verification
router.post('/kyc/verify-identity', async (req, res, next) => {
  try {
    const result = await identityService.verifyIdentity(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Regulatory Compliance Reporting
router.get('/regulatory-report', async (req, res, next) => {
  try {
    const authority = (req.query.authority as any) || 'SEBI';
    const report = await regulatoryReportService.generateReport({
      authority,
      periodStart: (req.query.start as string) || '2026-01-01',
      periodEnd: (req.query.end as string) || '2026-07-31',
    });
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

export default router;
