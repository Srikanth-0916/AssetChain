import api from './api';
import type { ApiResponse } from '../types/api';

export const portfolioService = {
  async getPortfolio() {
    const response = await api.get<ApiResponse<any>>('/portfolio');
    return response.data.data;
  },
};
