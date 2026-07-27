import { z } from 'zod';

/**
 * Shared Zod validation schemas for request validation.
 */

// ─── Auth Schemas ───

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be at most 255 characters')
    .trim(),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['asset_owner', 'investor'], {
    errorMap: () => ({ message: 'Role must be either asset_owner or investor' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const walletNonceSchema = z.object({
  wallet_address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address'),
});

export const walletVerifySchema = z.object({
  wallet_address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address'),
  signature: z.string().min(1, 'Signature is required'),
});

// ─── User Schemas ───

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255)
    .trim()
    .optional(),
});

export const kycActionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().optional(),
}).refine(
  (data) => data.status !== 'rejected' || (data.rejection_reason && data.rejection_reason.length > 0),
  { message: 'Rejection reason is required when rejecting KYC', path: ['rejection_reason'] }
);

export const suspendUserSchema = z.object({
  is_suspended: z.boolean(),
  reason: z.string().optional(),
});

// ─── Asset Schemas ───

export const createAssetSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be at most 255 characters')
    .trim(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be at most 5000 characters')
    .trim(),
  asset_type: z.enum([
    'residential_real_estate',
    'commercial_property',
    'agricultural_land',
    'artwork',
    'luxury_collectibles',
    'renewable_energy',
    'commercial_equipment',
  ]),
  location: z.string().max(500).optional(),
  valuation: z.number().positive('Valuation must be positive'),
  token_supply: z
    .number()
    .int()
    .min(100, 'Minimum token supply is 100')
    .max(10_000_000, 'Maximum token supply is 10,000,000'),
});

export const assetStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  rejection_reason: z.string().optional(),
}).refine(
  (data) => data.status !== 'rejected' || (data.rejection_reason && data.rejection_reason.length > 0),
  { message: 'Rejection reason is required when rejecting', path: ['rejection_reason'] }
);

// ─── Marketplace Schemas ───

export const buyTokensSchema = z.object({
  asset_id: z.string().uuid('Invalid asset ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  transaction_hash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
});

export const createListingSchema = z.object({
  asset_id: z.string().uuid('Invalid asset ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price_per_token: z.number().positive('Price must be positive'),
});

// ─── DAO Schemas ───

export const createProposalSchema = z.object({
  asset_id: z.string().uuid().nullable().optional(),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255)
    .trim(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000)
    .trim(),
  duration_days: z.number().int().min(1).max(30),
  quorum_threshold: z.number().int().positive(),
});

export const castVoteSchema = z.object({
  vote: z.enum(['for', 'against', 'abstain']),
  transaction_hash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
});

// ─── Type Exports ───

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type BuyTokensInput = z.infer<typeof buyTokensSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
