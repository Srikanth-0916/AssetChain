/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_POLYGON_AMOY_CHAIN_ID: string;
  readonly VITE_POLYGON_AMOY_RPC_URL: string;
  readonly VITE_ASSET_REGISTRY_ADDRESS: string;
  readonly VITE_MARKETPLACE_ADDRESS: string;
  readonly VITE_GOVERNANCE_ADDRESS: string;
  readonly VITE_TREASURY_ADDRESS: string;
  readonly VITE_USDC_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
