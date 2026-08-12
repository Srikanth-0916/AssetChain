import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { env } from '../config/env';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { parsePagination, calculateTotalPages } from '../utils/pagination';
import { notificationService } from '../modules/notifications/notification.service';
import { approvalService } from '../modules/approval/approval.service';
import { encryptDocument, decryptDocument, EncryptedDocument } from '../utils/encryption';

const docMemoryStore = new Map<string, { id: string; asset_id: string; owner_id: string; document_type: string; file_name: string; mime_type: string; encrypted_data: string }>();

export class AssetService {
  /**
   * Create a new asset listing (Asset Owner). Writes directly to Supabase.
   * Document attachments are ALWAYS encrypted with AES-256-GCM before storage.
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
      documents?: Array<{
        document_type: string;
        file_name: string;
        ipfs_cid: string;
        mime_type: string;
        file_size_bytes: number;
        encrypted_data?: string;
      }>;
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
      // token_price is a GENERATED column in Supabase (valuation / token_supply) — do not insert
      verification_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedAsset, error } = await supabaseAdmin
      .from('assets')
      .insert(newAsset)
      .select()
      .single();

    if (error) {
      console.error('[AssetService] ❌ Supabase asset insert error:', error.message);
      throw new Error(`Failed to create asset: ${error.message}`);
    }

    const assetResult = insertedAsset ?? newAsset;

    // Insert asset documents into asset_documents table with mandatory AES-256-GCM encryption
    if (data.documents && data.documents.length > 0) {
      const docRows = data.documents.map((doc) => {
        let encryptedPayloadJson: string | null = null;

        if (doc.encrypted_data) {
          // Check if data is already encrypted JSON structure, otherwise encrypt it now
          if (doc.encrypted_data.includes('"algorithm":"AES-256-GCM"')) {
            encryptedPayloadJson = doc.encrypted_data;
          } else {
            // Encrypt raw buffer/base64 string via AES-256-GCM
            const encryptedDoc = encryptDocument(doc.encrypted_data);
            encryptedPayloadJson = JSON.stringify(encryptedDoc);
          }
        }

        const fallbackCid = `Qm${crypto.createHash('sha256').update(doc.file_name + Date.now().toString()).digest('hex').slice(0, 44)}`;

        const row = {
          id: uuidv4(),
          asset_id: assetResult.id,
          document_type: doc.document_type || 'title_deed',
          file_name: doc.file_name,
          ipfs_cid: doc.ipfs_cid || fallbackCid,
          mime_type: doc.mime_type || 'application/pdf',
          file_size_bytes: doc.file_size_bytes || 1024,
          encrypted_data: encryptedPayloadJson || '',
          created_at: new Date().toISOString(),
        };
        docMemoryStore.set(row.id, { ...row, owner_id: ownerId });
        return row;
      });

      const { error: docError } = await supabaseAdmin.from('asset_documents').insert(docRows);
      if (docError) {
        console.error('[AssetService] ❌ asset_documents insert error:', docError.message);
        throw new Error(`Failed to insert asset documents: ${docError.message}`);
      }
    }

    // Automatically initialize multi-sig verifier review queue in Supabase
    try {
      await approvalService.createRequest(assetResult.id, assetResult.title);
    } catch (approvalErr: any) {
      console.warn('[AssetService] ⚠️ approval request initialization warning:', approvalErr.message);
    }

    // Notify the asset owner
    await notificationService.notify(
      ownerId,
      'asset_approved',
      'Asset Submitted for Verification',
      `Your asset "${data.title}" has been successfully submitted and is under multi-sig verifier review.`,
      { assetId: assetResult.id }
    );

    return {
      ...assetResult,
      owner: { id: ownerId, full_name: 'Verified Asset Owner' },
    };
  }

  /**
   * Secure Decryption Service Endpoint for Authorized Asset Document Access.
   * RBAC Enforced: Only Asset Owner, Verifier, Legal Reviewer, or Admin can access.
   */
  async getDecryptedDocument(documentId: string, requestingUser: { id: string; role: string }) {
    let doc: any = null;

    // Check memory cache first
    const cached = docMemoryStore.get(documentId);
    if (cached) {
      doc = {
        id: cached.id,
        asset_id: cached.asset_id,
        document_type: cached.document_type,
        file_name: cached.file_name,
        mime_type: cached.mime_type,
        encrypted_data: cached.encrypted_data,
        assets: { owner_id: cached.owner_id },
      };
    } else {
      try {
        const { data: dbDoc } = await supabaseAdmin
          .from('asset_documents')
          .select('id, asset_id, document_type, file_name, mime_type, encrypted_data, assets(owner_id)')
          .eq('id', documentId)
          .single();
        doc = dbDoc;
      } catch {}
    }

    if (!doc) {
      throw new NotFoundError('Asset document not found.');
    }

    // 2. RBAC Access Control Check
    const assetOwnerId = doc.assets?.owner_id;
    const allowedRoles = ['admin', 'verifier', 'legal_reviewer'];
    const isOwner = requestingUser.id === assetOwnerId;
    const isAuthorizedRole = allowedRoles.includes(requestingUser.role);

    if (!isOwner && !isAuthorizedRole) {
      throw new UnauthorizedError('Unauthorized: You do not have permission to view this legal property document.');
    }

    if (!doc.encrypted_data) {
      throw new NotFoundError('No encrypted document payload found for this document ID.');
    }

    // 3. Decrypt AES-256-GCM Ciphertext
    let encryptedObj: EncryptedDocument;
    try {
      encryptedObj = JSON.parse(doc.encrypted_data);
    } catch {
      throw new Error('Corrupted or invalid encrypted document payload format.');
    }

    const decryptedBuffer = decryptDocument(encryptedObj);

    return {
      documentId: doc.id,
      fileName: doc.file_name,
      mimeType: doc.mime_type,
      decryptedContent: decryptedBuffer.toString('utf8'),
      decryptedBuffer,
    };
  }


  /**
   * Get public marketplace assets with filtering. Reads from Supabase.
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
      .select(`
        id, owner_id, title, description, asset_type, location, valuation,
        token_supply, token_price, contract_address, ipfs_metadata_cid,
        verification_status, rejection_reason, verified_at, tokenized_at,
        created_at, updated_at,
        profiles!assets_owner_id_fkey(id, full_name)
      `, { count: 'exact' })
      .is('deleted_at', null);

    if (filters.status) {
      query = query.eq('verification_status', filters.status);
    }
    if (filters.asset_type) {
      query = query.eq('asset_type', filters.asset_type);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    const sortField = filters.sort || 'created_at';
    const sortOrder = filters.order === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortField, sortOrder);
    query = query.range(offset, offset + limit - 1);

    const { data: assets, error, count } = await query;

    if (error) {
      console.error('[AssetService] ❌ getMarketplaceAssets error:', error.message);
      return { assets: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }

    const assetArray = Array.isArray(assets) ? assets : [];

    const normalizedAssets = assetArray.map((a: any) => ({
      ...a,
      owner: a.profiles || { id: a.owner_id, full_name: 'Asset Owner' },
    }));

    const total = count ?? normalizedAssets.length;
    return {
      assets: normalizedAssets,
      meta: {
        page,
        limit,
        total,
        totalPages: calculateTotalPages(total, limit),
      },
    };
  }

  /**
   * Get assets owned by a specific user. Reads from Supabase.
   */
  async getMyAssets(ownerId: string) {
    const { data, error } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[AssetService] ⚠️ getMyAssets error:', error.message);
      return [];
    }
    return data || [];
  }

  /**
   * Get asset detail by ID from Supabase.
   */
  async getAssetById(assetId: string) {
    const { data, error } = await supabaseAdmin
      .from('assets')
      .select(`
        *,
        profiles!assets_owner_id_fkey(id, full_name)
      `)
      .eq('id', assetId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new NotFoundError('Asset');
    }
    return {
      ...data,
      owner: data.profiles || { id: data.owner_id, full_name: 'Asset Owner' },
    };
  }

  /**
   * Review asset status (Admin). Updates Supabase.
   */
  async updateAssetStatus(
    assetId: string,
    data: { status: 'under_review' | 'approved' | 'rejected'; rejection_reason?: string },
    adminId: string
  ) {
    const updatePayload: Record<string, any> = {
      verification_status: data.status,
      updated_at: new Date().toISOString(),
    };

    if (data.status === 'approved') {
      updatePayload.verified_at = new Date().toISOString();
      updatePayload.verified_by = adminId;
    }
    if (data.status === 'rejected') {
      updatePayload.rejection_reason = data.rejection_reason || null;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('assets')
      .update(updatePayload)
      .eq('id', assetId)
      .select()
      .single();

    if (error || !updated) {
      throw new NotFoundError('Asset');
    }

    // Notify Owner
    if (data.status === 'approved') {
      await notificationService.notify(
        updated.owner_id,
        'asset_approved',
        'Asset Verification Approved',
        `Your asset "${updated.title}" has been approved for tokenization!`,
        { assetId: updated.id }
      );
    } else if (data.status === 'rejected') {
      await notificationService.notify(
        updated.owner_id,
        'asset_rejected',
        'Asset Verification Rejected',
        `Your asset "${updated.title}" was rejected. ${data.rejection_reason ? 'Reason: ' + data.rejection_reason : ''}`,
        { assetId: updated.id, rejection_reason: data.rejection_reason }
      );
    }

    return updated;
  }


  /**
   * Tokenize approved asset (Admin). Updates Supabase.
   */
  async tokenizeAsset(assetId: string, contractAddress: string, adminId: string) {
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

    if (error || !updated) {
      console.error('[AssetService] ❌ tokenizeAsset error:', error?.message || 'No updated data returned');
      throw new NotFoundError('Asset');
    }
    return updated;
  }
}

export const assetService = new AssetService();
