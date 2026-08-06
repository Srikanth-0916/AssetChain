import { z } from 'zod';

/**
 * Schema for POST /investments/confirm
 * Validates the on-chain investment confirmation payload.
 * All fields are required and strictly typed.
 */
export const confirmInvestmentSchema = z.object({
  /** Real blockchain transaction hash (66 chars: 0x + 64 hex) */
  transactionHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format. Must be 0x followed by 64 hex characters.'),

  /** Investor's MetaMask wallet address */
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format. Must be a valid Ethereum address.'),

  /** Supabase asset UUID */
  assetId: z
    .string()
    .uuid('Invalid assetId — must be a valid UUID.'),

  /** Number of fractional tokens purchased */
  quantity: z
    .number()
    .int('Quantity must be a whole number.')
    .positive('Quantity must be positive.'),

  /** Total amount paid in wei (as string to avoid BigInt serialization issues) */
  amountWei: z
    .string()
    .regex(/^\d+$/, 'amountWei must be a positive integer string representing wei.'),

  /** Optional: block number from receipt (for quick verification) */
  blockNumber: z.number().int().positive().optional(),

  /** Optional: gas used from receipt */
  gasUsed: z.string().optional(),
});

export type ConfirmInvestmentInput = z.infer<typeof confirmInvestmentSchema>;
