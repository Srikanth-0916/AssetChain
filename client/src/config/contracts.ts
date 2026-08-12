/**
 * contracts.ts
 *
 * Central config for deployed smart contract addresses and ABIs.
 * Uses single unified Marketplace contract supporting both native POL and USDC.
 */

export const POLYGON_AMOY_CHAIN_ID = parseInt(
  import.meta.env.VITE_POLYGON_AMOY_CHAIN_ID || '80002'
);

export const POLYGON_AMOY_RPC_URL =
  import.meta.env.VITE_POLYGON_AMOY_RPC_URL ||
  'https://polygon-amoy.drpc.org';

export const POLYGONSCAN_BASE_URL = 'https://amoy.polygonscan.com';

/**
 * Unified Marketplace deployed address on Polygon Amoy.
 * Set VITE_MARKETPLACE_CONTRACT_ADDRESS in client/.env
 */
export const MARKETPLACE_ADDRESS =
  import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS ||
  import.meta.env.VITE_MARKETPLACE_ADDRESS ||
  '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB';

// Alias for backward compatibility
export const FRACTIONAL_MARKETPLACE_ADDRESS = MARKETPLACE_ADDRESS;

/**
 * ABI for Marketplace contract (POL primary sales + USDC secondary sales)
 */
export const MARKETPLACE_ABI = [
  // ─── Native POL Purchase ───────────────────────────────────────────────
  'function buyTokensWithPOL(string calldata assetId, uint256 quantity) external payable',

  // ─── POL View Functions ────────────────────────────────────────────────
  'function calculatePOLPrice(string calldata assetId, uint256 quantity) external view returns (uint256)',
  'function getPOLSaleConfig(string calldata assetId) external view returns (tuple(uint256 pricePerTokenWei, uint256 totalSupply, uint256 availableSupply, bool active, uint256 createdAt))',
  'function isPOLSaleAvailable(string calldata assetId) external view returns (bool)',
  'function totalPOLInvestmentCount() external view returns (uint256)',
  'function demoMode() external view returns (bool)',

  // ─── Legacy USDC Primary & Secondary ────────────────────────────────────
  'function buyPrimaryTokens(uint256 assetId, uint256 amount) external',
  'function createListing(address tokenContract, uint256 tokenAmount, uint256 pricePerToken) external returns (uint256)',
  'function buyListing(uint256 listingId, uint256 amount) external',
  'function cancelListing(uint256 listingId) external',

  // ─── Events ──────────────────────────────────────────────────────────────
  'event InvestmentCompleted(string indexed assetId, address indexed buyer, uint256 quantity, uint256 amountPaid, uint256 timestamp)',
  'event POLSaleCreated(string indexed assetId, uint256 pricePerTokenWei, uint256 totalSupply)',
  'event TokensPurchased(uint256 indexed assetId, address indexed buyer, uint256 amount, uint256 totalCost)',
] as const;

export const FRACTIONAL_MARKETPLACE_ABI = MARKETPLACE_ABI;

/** Helper to build PolygonScan URL for a transaction */
export function buildPolygonScanTxUrl(txHash: string): string {
  return `${POLYGONSCAN_BASE_URL}/tx/${txHash}`;
}

/** Helper to build PolygonScan URL for a wallet address */
export function buildPolygonScanAddressUrl(address: string): string {
  return `${POLYGONSCAN_BASE_URL}/address/${address}`;
}

/** Check if the contract address is configured */
export function isContractConfigured(): boolean {
  return (
    !!MARKETPLACE_ADDRESS &&
    MARKETPLACE_ADDRESS.startsWith('0x') &&
    MARKETPLACE_ADDRESS.length === 42
  );
}
