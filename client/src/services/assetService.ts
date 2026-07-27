import api from './api';
import type { Asset, CreateAssetData } from '../types/asset';
import type { ApiResponse } from '../types/api';

export const assetService = {
  async createAsset(data: CreateAssetData): Promise<Asset> {
    const response = await api.post<ApiResponse<Asset>>('/assets', data);
    return response.data.data;
  },

  async getMarketplaceAssets(params?: Record<string, any>): Promise<Asset[]> {
    const response = await api.get<ApiResponse<Asset[]>>('/assets', { params });
    return response.data.data;
  },

  async getMyAssets(): Promise<Asset[]> {
    const response = await api.get<ApiResponse<Asset[]>>('/assets/my');
    return response.data.data;
  },

  async getAssetById(id: string): Promise<Asset> {
    const response = await api.get<ApiResponse<Asset>>(`/assets/${id}`);
    return response.data.data;
  },

  async updateAssetStatus(id: string, status: string, rejection_reason?: string): Promise<Asset> {
    const response = await api.patch<ApiResponse<Asset>>(`/assets/${id}/status`, { status, rejection_reason });
    return response.data.data;
  },

  async tokenizeAsset(id: string, contract_address: string): Promise<Asset> {
    const response = await api.post<ApiResponse<Asset>>(`/assets/${id}/tokenize`, { contract_address });
    return response.data.data;
  },
};
