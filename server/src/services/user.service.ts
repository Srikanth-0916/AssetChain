import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { NotFoundError, UnprocessableError } from '../utils/errors';
import { parsePagination, calculateTotalPages } from '../utils/pagination';
import { walletService } from './wallet.service';
import { assetService } from './asset.service';
import { auditService } from '../modules/audit/audit.service';


// In-memory user store (dual-write with Supabase)
const localUsersStore = new Map<string, any>();

export class UserService {
  async getUsers(filters: { kyc_status?: string; role?: string; page?: string; limit?: string }) {
    const { page, limit, offset } = parsePagination(filters.page, filters.limit);

    // Try Supabase first
    try {
      let query = supabaseAdmin.from('profiles').select('id, full_name, email, role, kyc_status, wallet_address, is_suspended, created_at', { count: 'exact' });
      if (filters.kyc_status) query = query.eq('kyc_status', filters.kyc_status);
      if (filters.role) query = query.eq('role', filters.role);
      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (!error && data) {
        return {
          users: data,
          meta: { page, limit, total: count ?? 0, totalPages: calculateTotalPages(count ?? 0, limit) },
        };
      }
    } catch { /* fall through to memory */ }

    // Memory fallback
    let list = Array.from(localUsersStore.values());
    if (filters.kyc_status) list = list.filter((u) => u.kyc_status === filters.kyc_status);
    if (filters.role) list = list.filter((u) => u.role === filters.role);
    const total = list.length;
    return {
      users: list.slice(offset, offset + limit),
      meta: { page, limit, total, totalPages: calculateTotalPages(total, limit) },
    };
  }

  async updateProfile(userId: string, data: { full_name?: string; email?: string; profile_image_url?: string }) {
    // Try Supabase
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (data.full_name) updates.full_name = data.full_name;
      if (data.email) updates.email = data.email;
      if (data.profile_image_url) updates.profile_image_url = data.profile_image_url;

      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('id, full_name, email, role, kyc_status, wallet_address, profile_image_url')
        .single();
      if (!error && user) return user;
    } catch { /* fall through */ }

    // Memory fallback
    const existing = localUsersStore.get(userId);
    if (existing) {
      const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
      localUsersStore.set(userId, updated);
      return updated;
    }
    return { id: userId, ...data, updated_at: new Date().toISOString() };
  }

  async submitKYC(
    userId: string,
    documentCid: string,
    docDetails?: { file_name?: string; mime_type?: string; file_size_bytes?: number; document_type?: string }
  ) {
    const now = new Date().toISOString();
    const update = { kyc_status: 'pending', updated_at: now };

    try {
      await supabaseAdmin.from('profiles').update(update).eq('id', userId);

      // Insert record into kyc_documents table
      await supabaseAdmin.from('kyc_documents').insert({
        id: uuidv4(),
        user_id: userId,
        document_type: docDetails?.document_type || 'national_id',
        ipfs_cid: documentCid,
        file_name: docDetails?.file_name || `kyc_doc_${userId.slice(0, 8)}.pdf`,
        mime_type: docDetails?.mime_type || 'application/pdf',
        file_size_bytes: docDetails?.file_size_bytes || 2048,
        verification_status: 'pending',
        uploaded_at: now,
      });
    } catch { /* memory only */ }

    const existing = localUsersStore.get(userId);
    if (existing) localUsersStore.set(userId, { ...existing, ...update });

    await auditService.log({
      type: 'kyc_submitted',
      actorId: userId,
      actorRole: 'investor',
      description: `KYC document submitted (CID/Path: ${documentCid})`,
      severity: 'info',
    });

    return { id: userId, kyc_status: 'pending', kyc_document_cid: documentCid, kyc_submitted_at: now };
  }


  async reviewKYC(userId: string, action: { status: 'approved' | 'rejected'; rejection_reason?: string }, adminId: string) {
    const now = new Date().toISOString();
    const update: any = { kyc_status: action.status, kyc_verified_at: now };
    if (action.status === 'rejected' && action.rejection_reason) {
      update.rejection_reason = action.rejection_reason;
    }

    try {
      await supabaseAdmin.from('profiles').update(update).eq('id', userId);
    } catch { /* memory only */ }

    const existing = localUsersStore.get(userId);
    if (existing) localUsersStore.set(userId, { ...existing, ...update });

    await auditService.log({
      type: action.status === 'approved' ? 'kyc_approved' : 'kyc_rejected',
      actorId: adminId,
      actorRole: 'admin',
      description: `KYC ${action.status} for user ${userId}${action.rejection_reason ? ': ' + action.rejection_reason : ''}`,
      severity: action.status === 'approved' ? 'info' : 'warning',
    });

    // ─── Phase 1.4: Auto-sync KYC approval to on-chain whitelist ─────────────────
    if (action.status === 'approved') {
      this.triggerOnChainKycSync(userId).catch((err) =>
        console.error('[UserService] On-chain KYC sync error (non-blocking):', err.message)
      );
    }
    // ─────────────────────────────────────────────────────────────────────────────

    return { id: userId, kyc_status: action.status, kyc_verified_at: now };
  }

  /**
   * Async non-blocking: after KYC approval, sync compliance to all AssetToken contracts
   * associated with tokenized assets. This auto-whitelists the user on-chain.
   */
  private async triggerOnChainKycSync(userId: string) {
    // Get user wallet address
    let walletAddress: string | null = null;
    try {
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('wallet_address')
        .eq('id', userId)
        .single();
      walletAddress = user?.wallet_address || null;
    } catch { /* try memory */ }

    if (!walletAddress) {
      const memUser = localUsersStore.get(userId);
      walletAddress = memUser?.wallet_address || null;
    }

    if (!walletAddress) {
      console.log(`[UserService] No wallet address for user ${userId} — skipping on-chain compliance sync`);
      return;
    }

    // Get all tokenized asset contract addresses
    const res = await assetService.getMarketplaceAssets({ status: 'tokenized', limit: '100' });
    const assets = Array.isArray(res?.assets) ? res.assets : [];
    const contractAddresses = assets
      .map((a: any) => a.contract_address)
      .filter((addr: any) => addr && addr.startsWith('0x'));

    if (contractAddresses.length === 0) {
      console.log(`[UserService] No tokenized asset contracts found — skipping on-chain sync`);
      return;
    }

    const result = await walletService.syncComplianceToChain(walletAddress, contractAddresses, 1, 840, 1);
    console.log(`[UserService] On-chain KYC sync result for ${userId}:`, result);
  }

  async suspendUser(userId: string, data: { is_suspended: boolean; reason?: string }, adminId: string) {
    try {
      await supabaseAdmin.from('profiles').update({ is_suspended: data.is_suspended }).eq('id', userId);
    } catch { /* memory only */ }

    const existing = localUsersStore.get(userId);
    if (existing) localUsersStore.set(userId, { ...existing, is_suspended: data.is_suspended });

    await auditService.log({
      type: 'admin_action',
      actorId: adminId,
      actorRole: 'admin',
      description: `User ${userId} ${data.is_suspended ? 'suspended' : 'unsuspended'}${data.reason ? ': ' + data.reason : ''}`,
      severity: 'warning',
    });

    return { id: userId, is_suspended: data.is_suspended };
  }
}

export const userService = new UserService();
