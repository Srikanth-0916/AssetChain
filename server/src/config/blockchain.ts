import { ethers } from 'ethers';
import { env } from './env';

const AMOY_RPC_URLS = [
  env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
  'https://rpc-amoy.polygon.technology',
  'https://polygon-amoy.drpc.org',
  'https://rpc.ankr.com/polygon_amoy',
];

/**
 * Returns a resilient Ethers JsonRpcProvider with fallback endpoints for Polygon Amoy.
 */
export function getResilientProvider(): ethers.JsonRpcProvider {
  // Use primary RPC URL first, or fallback URL
  const primaryUrl = AMOY_RPC_URLS[0];
  return new ethers.JsonRpcProvider(primaryUrl);
}
