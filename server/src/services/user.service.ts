import { supabaseAdmin } from '../config/database';
import { NotFoundError, UnprocessableError } from '../utils/errors';
import { parsePagination, calculateTotalPages } from '../utils/pagination';

/**
 * User management service for profile updates and admin operations.
 */
export class UserService {
  /**
   * Get all users with filtering (admin).
   */
  async getUsers(filters: {
    role?: string;
    kyc_status?: string;
    is_suspended?: string;
    search?: string;
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
  }) {
    const { page, limit, offset } = parsePagination(filters.page, filters.limit);

    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, email, wallet_address, role, kyc_status, is_suspended, created_at, updated_at', { count: 'exact' });

    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.kyc_status) {
      query = query.eq('kyc_status', filters.kyc_status);
    }
    if (filters.is_suspended !== undefined) {
      query = query.eq('is_suspended', filters.is_suspended === 'true');
    }
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const sortField = filters.sort || 'created_at';
    const sortOrder = filters.order === 'asc' ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const total = count || 0;

    return {
      users: users || [],
      meta: {
        page,
        limit,
        total,
        totalPages: calculateTotalPages(total, limit),
      },
    };
  }

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, data: { full_name?: string }) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, full_name, email, wallet_address, role, kyc_status, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return user;
  }

  /**
   * Submit KYC documents (stores CID reference).
   */
  async submitKYC(userId: string, documentCid: string) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('kyc_status')
      .eq('id', userId)
      .single();

    if (user?.kyc_status === 'approved') {
      throw new UnprocessableError('KYC is already approved');
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: 'pending',
        kyc_document_cid: documentCid,
        kyc_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, kyc_status, kyc_submitted_at')
      .single();

    if (error) {
      throw new Error(`Failed to submit KYC: ${error.message}`);
    }

    return updated;
  }

  /**
   * Approve or reject KYC (admin).
   */
  async reviewKYC(
    userId: string,
    action: { status: 'approved' | 'rejected'; rejection_reason?: string },
    adminId: string
  ) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, kyc_status')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.kyc_status !== 'pending') {
      throw new UnprocessableError(`Cannot review KYC when status is "${user.kyc_status}"`);
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: action.status,
        kyc_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, full_name, email, kyc_status, kyc_verified_at')
      .single();

    if (error) {
      throw new Error(`Failed to update KYC status: ${error.message}`);
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: `kyc_${action.status}`,
      entity_type: 'user',
      entity_id: userId,
      new_values: { kyc_status: action.status, rejection_reason: action.rejection_reason },
    });

    // TODO: Create notification for user

    return updated;
  }

  /**
   * Suspend or unsuspend a user (admin).
   */
  async suspendUser(
    userId: string,
    data: { is_suspended: boolean; reason?: string },
    adminId: string
  ) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.role === 'admin') {
      throw new UnprocessableError('Cannot suspend an admin user');
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({
        is_suspended: data.is_suspended,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, full_name, email, is_suspended')
      .single();

    if (error) {
      throw new Error(`Failed to update suspension: ${error.message}`);
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: data.is_suspended ? 'user_suspended' : 'user_unsuspended',
      entity_type: 'user',
      entity_id: userId,
      new_values: { is_suspended: data.is_suspended, reason: data.reason },
    });

    return updated;
  }
}

export const userService = new UserService();
