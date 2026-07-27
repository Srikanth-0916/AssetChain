import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { NotFoundError, UnprocessableError } from '../utils/errors';
import { parsePagination, calculateTotalPages } from '../utils/pagination';

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
    // Check owner KYC status
    const { data: owner } = await supabaseAdmin
      .from('users')
      .select('kyc_status')
      .eq('id', ownerId)
      .single();

    if (!owner || owner.kyc_status !== 'approved') {
      throw new UnprocessableError('You must complete identity verification (KYC) before listing an asset');
    }

    const { data: asset, error } = await supabaseAdmin
      .from('assets')
      .insert({
        id: uuidv4(),
        owner_id: ownerId,
        title: data.title,
        description: data.description,
        asset_type: data.asset_type,
        location: data.location || null,
        valuation: data.valuation,
        token_supply: data.token_supply,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create asset: ${error.message}`);
    }

    return asset;
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

    let query = supabaseAdmin
      .from('assets')
      .select('*, owner:users!owner_id(id, full_name, email)', { count: 'exact' });

    // Filter by status (default: tokenized & approved for marketplace)
    if (filters.status) {
      query = query.eq('verification_status', filters.status);
    } else {
      query = query.in('verification_status', ['approved', 'tokenized']);
    }

    if (filters.asset_type) {
      query = query.eq('asset_type', filters.asset_type);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const sortField = filters.sort || 'created_at';
    const sortOrder = filters.order === 'asc' ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    query = query.range(offset, offset + limit - 1);

    const { data: assets, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch marketplace assets: ${error.message}`);
    }

    const total = count || 0;

    return {
      assets: assets || [],
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
    const { data: assets, error } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user assets: ${error.message}`);
    }

    return assets || [];
  }

  /**
   * Get asset detail by ID.
   */
  async getAssetById(assetId: string) {
    const { data: asset, error } = await supabaseAdmin
      .from('assets')
      .select('*, owner:users!owner_id(id, full_name, email, wallet_address), documents:asset_documents(*)')
      .eq('id', assetId)
      .single();

    if (error || !asset) {
      throw new NotFoundError('Asset');
    }

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
    const { data: asset } = await supabaseAdmin
      .from('assets')
      .select('id, verification_status')
      .eq('id', assetId)
      .single();

    if (!asset) {
      throw new NotFoundError('Asset');
    }

    const updatePayload: any = {
      verification_status: data.status,
      updated_at: new Date().toISOString(),
    };

    if (data.status === 'approved') {
      updatePayload.verified_at = new Date().toISOString();
    }
    if (data.status === 'rejected') {
      updatePayload.rejection_reason = data.rejection_reason || 'Asset rejected by platform admin';
    }

    const { data: updated, error } = await supabaseAdmin
      .from('assets')
      .update(updatePayload)
      .eq('id', assetId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update asset status: ${error.message}`);
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: `asset_${data.status}`,
      entity_type: 'asset',
      entity_id: assetId,
      new_values: data,
    });

    return updated;
  }

  /**
   * Tokenize approved asset (Admin).
   */
  async tokenizeAsset(assetId: string, contractAddress: string, adminId: string) {
    const { data: asset } = await supabaseAdmin
      .from('assets')
      .select('id, verification_status')
      .eq('id', assetId)
      .single();

    if (!asset) throw new NotFoundError('Asset');

    if (asset.verification_status !== 'approved') {
      throw new UnprocessableError('Asset must be in approved status to be tokenized');
    }

    const { data: updated, error } = await supabaseAdmin
      .from('assets')
      .update({
        contract_address: contractAddress,
        verification_status: 'tokenized',
        tokenized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tokenization: ${error.message}`);
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'asset_tokenized',
      entity_type: 'asset',
      entity_id: assetId,
      new_values: { contract_address: contractAddress },
    });

    return updated;
  }
}

export const assetService = new AssetService();
