/**
 * PolygonScan Block Explorer Link Helper.
 * Network: Polygon Amoy Testnet (Chain ID: 80002)
 */

export const POLYGON_AMOY_EXPLORER_BASE = 'https://amoy.polygonscan.com';

export const KNOWN_CONTRACTS = {
  ASSET_REGISTRY: '0x3aB481023cC82A7D2C04e8bC87332cEDa86c6a4F',
  MARKETPLACE:     '0x72a5C1d07c089D1C90e0e0aF42dB3A7E303A4e99',
  TREASURY:        '0x81b7eF29eD722F0e4d7a8C4C61706a12B4711867',
  DAO_GOVERNANCE:  '0x45f42c3C886B8C24F0e227092305590918c5e622',
  PAYMENT_TOKEN:   '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // Mock USDC
};

export const getExplorerAddressLink = (address: string): string => {
  if (!address) return POLYGON_AMOY_EXPLORER_BASE;
  return `${POLYGON_AMOY_EXPLORER_BASE}/address/${address}`;
};

export const getExplorerTxLink = (txHash: string): string => {
  if (!txHash) return POLYGON_AMOY_EXPLORER_BASE;
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
