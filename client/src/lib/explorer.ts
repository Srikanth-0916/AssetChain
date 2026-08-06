/**
 * PolygonScan Block Explorer Link Helper.
 * Network: Polygon Amoy Testnet (Chain ID: 80002)
 */

export const POLYGON_AMOY_EXPLORER_BASE = 'https://amoy.polygonscan.com';

export const KNOWN_CONTRACTS = {
  ASSET_REGISTRY: '0x5C6241aEf58367E5D485D5eBAa8D9997e231F508',
  MARKETPLACE:     '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB',
  TREASURY:        '0xF4C5a9d12779D7FaA5933A7De041332151570c68',
  DAO_GOVERNANCE:  '0xb5cb2DA91Dc774EE587301f63eb7fb020e11Bc87',
  PAYMENT_TOKEN:   '0x197367CB43beEF2f123731Ca4DE5C55B81Ae3d86', // MockUSDC
};

export const getExplorerAddressLink = (address: string): string => {
  if (!address) return POLYGON_AMOY_EXPLORER_BASE;
  return `${POLYGON_AMOY_EXPLORER_BASE}/address/${address}`;
};

/** Check if a transaction hash is a real on-chain EVM transaction (0x + 64 hex chars) */
export const isRealOnChainTx = (txHash: string | undefined | null): boolean => {
  if (!txHash) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
};

export const getExplorerTxLink = (txHash: string): string => {
  if (!txHash || !isRealOnChainTx(txHash)) return POLYGON_AMOY_EXPLORER_BASE;
  return `${POLYGON_AMOY_EXPLORER_BASE}/tx/${txHash}`;
};

export const getContractExplorerLink = (type: 'registry' | 'marketplace' | 'treasury' | 'dao' | 'usdc'): string => {
  switch (type) {
    case 'registry':     return getExplorerAddressLink(KNOWN_CONTRACTS.ASSET_REGISTRY);
    case 'marketplace':  return getExplorerAddressLink(KNOWN_CONTRACTS.MARKETPLACE);
    case 'treasury':     return getExplorerAddressLink(KNOWN_CONTRACTS.TREASURY);
    case 'dao':          return getExplorerAddressLink(KNOWN_CONTRACTS.DAO_GOVERNANCE);
    case 'usdc':         return getExplorerAddressLink(KNOWN_CONTRACTS.PAYMENT_TOKEN);
    default:             return POLYGON_AMOY_EXPLORER_BASE;
  }
};
