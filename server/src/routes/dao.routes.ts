import { Router } from 'express';
import { daoController } from '../controllers/dao.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validator';
import { createProposalSchema, castVoteSchema } from '../utils/validators';

const router = Router();

router.get('/proposals', authenticate, daoController.getProposals);

router.post(
  '/proposals',
  authenticate,
  roleGuard('admin', 'investor', 'asset_owner'),
  validate(createProposalSchema),
  daoController.createProposal
);

router.post(
  '/proposals/:id/vote',
  authenticate,
  roleGuard('investor', 'asset_owner'),
  validate(castVoteSchema),
  daoController.castVote
);

export default router;
