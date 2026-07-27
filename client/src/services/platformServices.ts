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
