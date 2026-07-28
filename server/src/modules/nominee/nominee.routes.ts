import { Router } from 'express';
import { nomineeController } from './nominee.controller';
import { authenticate, authorizeRole } from '../../middleware/auth';

const router = Router();

router.get('/my-nominee', authenticate, nomineeController.getNominee);
router.post('/my-nominee', authenticate, nomineeController.setNominee);
router.delete('/my-nominee', authenticate, nomineeController.deleteNominee);

router.post('/inheritance/claim', nomineeController.submitClaim);
router.get('/inheritance/claims', authenticate, authorizeRole('admin'), nomineeController.getAllClaims);
router.post('/inheritance/verify/:claimId', authenticate, authorizeRole('admin'), nomineeController.verifyClaim);
router.post('/inheritance/execute/:claimId', authenticate, authorizeRole('admin'), nomineeController.executeTransfer);

export default router;
