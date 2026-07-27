/**
 * Asset types matching the database schema.
 */

export type AssetType =
  | 'residential_real_estate'
  | 'commercial_property'
  | 'agricultural_land'
  | 'artwork'
  | 'luxury_collectibles'
  | 'renewable_energy'
  | 'commercial_equipment';

export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'tokenized';

export interface Asset {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  asset_type: AssetType;
  location?: string;
  valuation: number;
  token_supply: number;
  token_price: number;
  tokens_available?: number;
  contract_address?: string;
  ipfs_metadata_cid?: string;
  verification_status: VerificationStatus;
  rejection_reason?: string;
  images?: string[];
  owner?: { id: string; full_name: string };
  created_at: string;
  updated_at?: string;
}

export interface CreateAssetData {
  title: string;
  description: string;
  asset_type: AssetType;
  location?: string;
  valuation: number;
  token_supply: number;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  residential_real_estate: 'Residential Real Estate',
  commercial_property: 'Commercial Property',
  agricultural_land: 'Agricultural Land',
  artwork: 'Artwork',
  luxury_collectibles: 'Luxury Collectibles',
  renewable_energy: 'Renewable Energy',
  commercial_equipment: 'Commercial Equipment',
};
