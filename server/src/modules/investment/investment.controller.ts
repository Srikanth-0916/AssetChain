import { Request, Response, NextFunction } from 'express';
import { investmentService } from './investment.service';
import { confirmInvestmentSchema } from './investment.validator';

/**
 * POST /api/v1/investments/confirm
 *
 * Confirms a real on-chain investment made via MetaMask on Polygon Amoy.
 * Runs full blockchain verification before writing to Supabase.
 *
 * Flow:
 *   1. Validate request body via Zod schema
 *   2. Extract userId from JWT (req.user.id)
 *   3. Delegate to investmentService.confirmOnChainInvestment()
 *   4. Return confirmed investment details + PolygonScan URL
 */
export async function confirmInvestment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // ─── 1. Validate request body ──────────────────────────────────────────
    const parseResult = confirmInvestmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid investment confirmation request',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    // ─── 2. Extract authenticated user ─────────────────────────────────────
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
      });
      return;
    }

    // ─── 3. Confirm investment ─────────────────────────────────────────────
    const result = await investmentService.confirmOnChainInvestment({
      ...parseResult.data,
      userId,
    });

    // ─── 4. Respond ────────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        investmentId: result.investmentId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        polygonscanUrl: result.polygonscanUrl,
        tokensOwned: result.tokensOwned,
        totalInvested: result.totalInvested,
        message: result.message,
        network: 'polygon-amoy',
        chainId: 80002,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/investments/my
 *
 * Returns all investments for the authenticated user,
 * including on-chain transaction details and PolygonScan links.
 */
export async function getMyInvestments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
      });
      return;
    }

    const investments = await investmentService.getUserInvestments(userId);

    res.status(200).json({
      success: true,
      data: investments,
      meta: {
        count: investments.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}
