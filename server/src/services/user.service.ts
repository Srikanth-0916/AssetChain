import { supabaseAdmin } from '../config/database';
import { NotFoundError, UnprocessableError } from '../utils/errors';
import { parsePagination, calculateTotalPages } from '../utils/pagination';

export class UserService {
  async getUsers(filters: any) {
    return {
      users: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }

  async updateProfile(userId: string, data: { full_name?: string }) {
    return {
      id: userId,
      full_name: data.full_name || 'User',
      updated_at: new Date().toISOString(),
    };
  }

  async submitKYC(userId: string, documentCid: string) {
    return {
      id: userId,
      kyc_status: 'pending',
      kyc_document_cid: documentCid,
      kyc_submitted_at: new Date().toISOString(),
    };
  }

  async reviewKYC(userId: string, action: any, adminId: string) {
    return {
      id: userId,
      kyc_status: action.status,
      kyc_verified_at: new Date().toISOString(),
    };
  }

  async suspendUser(userId: string, data: any, adminId: string) {
    return {
      id: userId,
      is_suspended: data.is_suspended,
    };
  }
}

export const userService = new UserService();
