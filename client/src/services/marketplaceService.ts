import api from './api';
import type { ApiResponse } from '../types/api';

export interface BuyTokensPayload {
  asset_id: string;
  quantity: number;
  transaction_hash: string;
}

export const marketplaceService = {
  async buyPrimaryTokens(data: BuyTokensPayload) {
    const response = await api.post<ApiResponse<any>>('/marketplace/buy', data);
    return response.data.data;
  },
};
