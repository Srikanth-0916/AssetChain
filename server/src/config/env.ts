import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

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
  PINATA_GATEWAY_URL: z.string().default('https://gateway.pinata.cloud/ipfs'),

  // Blockchain
  POLYGON_AMOY_RPC_URL: z.string().url().default('https://rpc-amoy.polygon.technology'),
  DEPLOYER_PRIVATE_KEY: z.string().min(1).default('0x0000000000000000000000000000000000000000000000000000000000000001'),
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
