import api from './api';
import type { AuthResponse, RegisterData, LoginData } from '../types/user';
import type { ApiResponse } from '../types/api';

/**
 * Authentication API service.
 */
export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<AuthResponse['user']> {
    const response = await api.get<ApiResponse<AuthResponse['user']>>('/auth/me');
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return response.data.data;
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, new_password });
    return response.data.data;
  },

  async requestPublicWalletNonce(wallet_address: string): Promise<{ nonce: string; expires_at: string }> {
    const response = await api.post<ApiResponse<{ nonce: string; expires_at: string }>>('/auth/wallet/public-nonce', { wallet_address });
    return response.data.data;
  },

  async loginWithWallet(wallet_address: string, signature: string, role: string = 'investor'): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/wallet/login', { wallet_address, signature, role });
    return response.data.data;
  },

  async requestWalletNonce(wallet_address: string): Promise<{ nonce: string; expires_at: string }> {
    const response = await api.post<ApiResponse<{ nonce: string; expires_at: string }>>('/auth/wallet/nonce', { wallet_address });
    return response.data.data;
  },

  async verifyWallet(wallet_address: string, signature: string): Promise<{ wallet_address: string; linked: boolean; token: string }> {
    const response = await api.post<ApiResponse<{ wallet_address: string; linked: boolean; token: string }>>('/auth/wallet/verify', { wallet_address, signature });
    return response.data.data;
  },
};
