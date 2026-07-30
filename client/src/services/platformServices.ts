import api from './api';

export const analyticsService = {
  async getOverview() {
    const { data } = await api.get('/analytics/overview');
    return data.data;
  },
};

export const notificationApiService = {
  async getNotifications() {
    const { data } = await api.get('/notifications');
    return data.data;
  },

  async markRead(notificationId: string) {
    const { data } = await api.post('/notifications/mark-read', { notification_id: notificationId });
    return data.data;
  },
};

export const paymentApiService = {
  async createOrder(amountUsd: number, assetId: string, tokenQuantity: number) {
    const { data } = await api.post('/payments/create-order', {
      amount_usd: amountUsd,
      asset_id: assetId,
      token_quantity: tokenQuantity,
    });
    return data.data;
  },

  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    asset_id: string;
    token_quantity: number;
  }) {
    const { data } = await api.post('/payments/verify', payload);
    return data.data;
  },
};

export const verificationApiService = {
  async analyzeAsset(assetId: string, ipfsCid?: string) {
    const { data } = await api.post('/verification/analyze', {
      asset_id: assetId,
      ipfs_cid: ipfsCid,
    });
    return data.data;
  },
};

// ─── Phase 2: Admin-facing API services ───────────────────────────────────────

export const adminUserService = {
  /** GET /users?kyc_status=pending — for AdminPanel KYC queue */
  async getKycQueue() {
    const { data } = await api.get('/users', { params: { kyc_status: 'pending', limit: 50 } });
    return data.data ?? [];
  },

  /** GET /users — all users with optional filters */
  async getUsers(filters?: { kyc_status?: string; role?: string; page?: number }) {
    const { data } = await api.get('/users', { params: filters });
    return data;
  },

  /** PATCH /users/:id/kyc — approve or reject KYC */
  async reviewKyc(userId: string, status: 'approved' | 'rejected', rejection_reason?: string) {
    const { data } = await api.patch(`/users/${userId}/kyc`, { status, rejection_reason });
    return data.data;
  },

  /** PATCH /users/:id/suspend — suspend or unsuspend */
  async suspendUser(userId: string, is_suspended: boolean, reason?: string) {
    const { data } = await api.patch(`/users/${userId}/suspend`, { is_suspended, reason });
    return data.data;
  },
};

export const adminAssetService = {
  /** GET /assets?status=pending — for AdminPanel pending assets */
  async getPendingAssets() {
    const { data } = await api.get('/assets', { params: { status: 'pending', limit: 50 } });
    return data.data?.assets ?? [];
  },

  /** PATCH /assets/:id/status — approve, reject, or mark under review */
  async reviewAsset(assetId: string, status: 'under_review' | 'approved' | 'rejected', rejection_reason?: string) {
    const { data } = await api.patch(`/assets/${assetId}/status`, { status, rejection_reason });
    return data.data;
  },

  /** POST /assets/:id/tokenize — tokenize an approved asset */
  async tokenizeAsset(assetId: string, contractAddress: string) {
    const { data } = await api.post(`/assets/${assetId}/tokenize`, { contract_address: contractAddress });
    return data.data;
  },
};

export const adminApprovalService = {
  /** GET /approval — list all multi-sig approval requests */
  async getApprovalRequests(status?: string) {
    const { data } = await api.get('/approval', { params: status ? { status } : {} });
    return data.data ?? [];
  },

  /** POST /approval — create a new approval request for an asset */
  async createApprovalRequest(assetId: string, assetTitle: string) {
    const { data } = await api.post('/approval', { asset_id: assetId, asset_title: assetTitle });
    return data.data;
  },

  /** POST /approval/vote — cast a multi-sig vote */
  async castVote(requestId: string, role: string, decision: 'approved' | 'rejected', comments?: string) {
    const { data } = await api.post('/approval/vote', { request_id: requestId, role, decision, comments });
    return data.data;
  },
};

export const adminAuditService = {
  /** GET /audit — paginated audit log */
  async getAuditLog(page = 1, limit = 20, severity?: string) {
    const { data } = await api.get('/audit', { params: { page, limit, severity } });
    return data;
  },
};

export const adminNomineeService = {
  /** GET /nominee — list nominees, optionally filter by status */
  async getNominees(status?: string) {
    const { data } = await api.get('/nominee', { params: status ? { status } : {} });
    return data.data ?? [];
  },

  /** PATCH /nominee/:id/status — approve or reject inheritance claim */
  async reviewClaim(nomineeId: string, status: 'approved' | 'rejected', reason?: string) {
    const { data } = await api.patch(`/nominee/${nomineeId}/status`, { status, reason });
    return data.data;
  },
};
