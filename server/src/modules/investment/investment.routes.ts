import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { confirmInvestment, getMyInvestments } from './investment.controller';

const router = Router();

/**
 * POST /api/v1/investments/confirm
 *
 * Verifies and records a real on-chain investment from Polygon Amoy.
 * Called by the frontend AFTER tx.wait(1) succeeds in MetaMask.
 *
 * Body:
 *   transactionHash: string  (0x + 64 hex chars)
 *   walletAddress:   string  (investor MetaMask address)
 *   assetId:         string  (Supabase UUID)
 *   quantity:        number  (tokens purchased)
 *   amountWei:       string  (total wei paid)
 *   blockNumber?:    number  (from receipt)
 *   gasUsed?:        string  (from receipt)
 */
router.post('/confirm', authenticate, confirmInvestment);

/**
 * GET /api/v1/investments/my
 *
 * Returns all investments for the authenticated user.
 * Includes transaction hashes, block numbers, and PolygonScan URLs.
 */
router.get('/my', authenticate, getMyInvestments);

export default router;
