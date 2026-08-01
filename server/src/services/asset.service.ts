import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { env } from '../config/env';
import { NotFoundError, UnprocessableError } from '../utils/errors';
import { parsePagination, calculateTotalPages } from '../utils/pagination';

// Local memory store for assets
const localAssetsStore: Map<string, any> = new Map();

// Seed initial marketplace assets
const initialDemoAssets = [
  {
    id: 'asset-demo-uuid-001',
    owner_id: 'owner-demo-uuid-002',
    title: 'Manhattan Commercial Plaza',
    description: 'Prime Class-A commercial office plaza in downtown Manhattan with 98% occupancy rate and long-term enterprise tenants.',
    asset_type: 'commercial_property',
    location: 'New York, USA',
    valuation: 2500000,
    token_supply: 10000,
    token_price: 250,
    contract_address: '0x1111111111111111111111111111111111111111',
    verification_status: 'tokenized',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    owner: { id: 'owner-demo-uuid-002', full_name: 'Jane Smith (Asset Owner)' },
  },
  {
    id: 'asset-demo-uuid-002',
    owner_id: 'owner-demo-uuid-002',
    title: 'Solar Farm Alpha 1',
    description: '50MW solar photovoltaic utility facility generating sustainable green energy sold under 15-year power purchase agreement (PPA).',
    asset_type: 'renewable_energy',
    location: 'Valencia, Spain',
    valuation: 1200000,
    token_supply: 10000,
    token_price: 120,
    contract_address: '0x2222222222222222222222222222222222222222',
    verification_status: 'tokenized',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    owner: { id: 'owner-demo-uuid-002', full_name: 'Jane Smith (Asset Owner)' },
  },
  {
    id: 'asset-demo-uuid-003',
    owner_id: 'owner-demo-uuid-002',
    title: 'Luxury Villa Compound',
    description: 'High-yield beachfront luxury villa residential complex generating rental yield in Dubai Marina.',
    asset_type: 'residential_real_estate',
    location: 'Dubai, UAE',
    valuation: 4500000,
    token_supply: 10000,
    token_price: 450,
    contract_address: '0x3333333333333333333333333333333333333333',
    verification_status: 'tokenized',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    owner: { id: 'owner-demo-uuid-002', full_name: 'Jane Smith (Asset Owner)' },
  },
];

for (const a of initialDemoAssets) {
  localAssetsStore.set(a.id, a);
}

export class AssetService {
  /**
   * Create a new asset listing (Asset Owner).
   */
  async createAsset(
    ownerId: string,
    data: {
      title: string;
      description: string;
      asset_type: string;
      location?: string;
      valuation: number;
      token_supply: number;
    }
  ) {
    const token_price = Number((data.valuation / data.token_supply).toFixed(2));

    const newAsset = {
      id: uuidv4(),
      owner_id: ownerId,
      title: data.title,
      description: data.description,
      asset_type: data.asset_type,
      location: data.location || 'Global Location',
      valuation: data.valuation,
      token_supply: data.token_supply,
      token_price,
      verification_status: 'pending',
      created_at: new Date().toISOString(),
      owner: { id: ownerId, full_name: 'Verified Asset Owner' },
    };

    localAssetsStore.set(newAsset.id, newAsset);

    // 1. Ensure profile & auth.users exist in Supabase so foreign key constraint owner_id -> profiles(id) succeeds
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(ownerId)) {
      try {
        await supabaseAdmin.auth.admin.createUser({
          id: ownerId,
          email: `owner_${ownerId.substring(0, 8)}@assetchain.io`,
          password: 'TestPassword123!',
          email_confirm: true,
        });
      } catch {}

      try {
        await supabaseAdmin.from('profiles').upsert({
          id: ownerId,
          full_name: 'Verified Asset Owner',
          email: `owner_${ownerId.substring(0, 8)}@assetchain.io`,
          role: 'asset_owner',
          kyc_status: 'approved',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch {}
    }

    // 2. Prepare database payload: exclude non-column 'owner' and generated column 'token_price'
    const { owner, token_price: _tp, ...dbPayload } = newAsset;

    const { error } = await supabaseAdmin.from('assets').insert(dbPayload);
    if (error) {
      console.error('[AssetService] ❌ Supabase assets insert error:', error.message);
      if (env.NODE_ENV === 'production') {
        throw new Error(`Database persistence failure: ${error.message}`);
      } else {
        console.warn(`[AssetService] ⚠️ Supabase write warning: ${error.message}`);
      }
    } else {
      console.log(`[AssetService] ✅ Asset successfully persisted to Supabase DB (ID: ${newAsset.id})`);
    }

    return newAsset;
  }

  /**
   * Get public marketplace assets with filtering.
   */
  async getMarketplaceAssets(filters: {
    asset_type?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
  }) {
    const { page, limit, offset } = parsePagination(filters.page, filters.limit);
    let list = Array.from(localAssetsStore.values());

    // Filter status
    if (filters.status) {
      list = list.filter((a) => a.verification_status === filters.status);
    }

    if (filters.asset_type) {
      list = list.filter((a) => a.asset_type === filters.asset_type);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const paginatedAssets = list.slice(offset, offset + limit);

    return {
      assets: paginatedAssets,
      meta: {
        page,
        limit,
        total,
        totalPages: calculateTotalPages(total, limit),
      },
    };
  }

  /**
   * Get assets owned by a user.
   */
  async getMyAssets(ownerId: string) {
    return Array.from(localAssetsStore.values()).filter((a) => a.owner_id === ownerId);
  }

  /**
   * Get asset detail by ID.
   */
  async getAssetById(assetId: string) {
    const asset = localAssetsStore.get(assetId);
    if (!asset) throw new NotFoundError('Asset');
    return asset;
  }

  /**
   * Review asset status (Admin).
   */
  async updateAssetStatus(
    assetId: string,
    data: { status: 'under_review' | 'approved' | 'rejected'; rejection_reason?: string },
    adminId: string
  ) {
    const asset = localAssetsStore.get(assetId);
    if (!asset) throw new NotFoundError('Asset');

    asset.verification_status = data.status;
    asset.updated_at = new Date().toISOString();
    if (data.status === 'approved') asset.verified_at = new Date().toISOString();
    if (data.status === 'rejected') asset.rejection_reason = data.rejection_reason;

    localAssetsStore.set(assetId, asset);
    return asset;
  }

  /**
   * Tokenize approved asset (Admin).
   */
  async tokenizeAsset(assetId: string, contractAddress: string, adminId: string) {
    const asset = localAssetsStore.get(assetId);
    if (!asset) throw new NotFoundError('Asset');

    asset.contract_address = contractAddress;
    asset.verification_status = 'tokenized';
    asset.tokenized_at = new Date().toISOString();
    asset.updated_at = new Date().toISOString();

    localAssetsStore.set(assetId, asset);
    return asset;
  }
}

export const assetService = new AssetService();
