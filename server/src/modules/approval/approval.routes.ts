import { Router } from 'express';
import { approvalController } from './approval.controller';
import { authenticate } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();
router.use(authenticate);
router.use(roleGuard('admin'));

router.post('/request', (req, res, next) => approvalController.createRequest(req, res, next));
router.post('/vote', (req, res, next) => approvalController.submitVote(req, res, next));
router.get('/pending', (req, res, next) => approvalController.getPending(req, res, next));
router.get('/', (req, res, next) => approvalController.getAll(req, res, next));
router.get('/asset/:assetId', (req, res, next) => approvalController.getByAsset(req, res, next));
router.get('/:id', (req, res, next) => approvalController.getById(req, res, next));

export default router;
