import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Resolve .env relative to this file's directory (server/.env),
// so it works correctly regardless of the process working directory.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Supabase
  SUPABASE_URL: z.string().url().default('https://mock.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('mock_key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('mock_key'),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:password@localhost:5432/assetchain'),

  // JWT
  JWT_SECRET: z.string().min(32).default('assetchain_super_secret_jwt_key_min_32_characters_long'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Pinata
  PINATA_API_KEY: z.string().min(1).default('mock_key'),
  PINATA_SECRET_KEY: z.string().min(1).default('mock_key'),
  PINATA_API_SECRET: z.string().optional().default(''),
  PINATA_JWT: z.string().optional().default(''),
  PINATA_GATEWAY_URL: z.string().default('https://gateway.pinata.cloud/ipfs'),

  // Blockchain
  POLYGON_AMOY_RPC_URL: z.string().url().default('https://rpc-amoy.polygon.technology'),
  DEPLOYER_PRIVATE_KEY: z.string().min(1).default('0x0000000000000000000000000000000000000000000000000000000000000001'),

  // AI Copilot — injected via GitHub Secret in CI, or set in server/.env locally.
  // Do NOT provide a default: an empty default masked the missing-key bug.
  GEMINI_API_KEY: z.string().optional(),

  // Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),

  // Infrastructure (optional)
  REDIS_URL: z.string().optional().default(''),
  CHROMA_URL: z.string().optional().default(''),

  // Gnosis Safe Multi-Sig (Phase 1.2)
  // Set in production to real deployed Safe address on Polygon Amoy
  GNOSIS_SAFE_ADDRESS: z.string().optional().default(''),
  // Comma-separated signer wallet addresses (verifier,legal_reviewer,admin)
  GNOSIS_SAFE_SIGNERS: z.string().optional().default(''),
  // Deployer wallet address (used for on-chain whitelist sync, audit anchoring)
  DEPLOYER_WALLET_ADDRESS: z.string().optional().default(''),

  // Versioning
  APP_VERSION: z.string().default('2.1.0'),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      console.error(`\n❌ Environment validation failed:\n${missing}\n`);
      console.error('Please check your .env file against .env.example\n');
    }
    process.exit(1);
  }
}

export const env = validateEnv();
