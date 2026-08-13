import api from './api';
import type { ApiResponse } from '../types/api';

/**
 * Empty portfolio state for new users with zero investments.
 * No fake holdings, no demo data — real users start from zero.
 */
export const EMPTY_PORTFOLIO = {
  summary: {
    total_invested: 0,
    current_value: 0,
    total_profit_loss: 0,
    unclaimed_dividends: 0,
    claimed_dividends: 0,
    total_assets: 0,
    governance_votes: 0,
    data_source: 'Polygon Amoy Smart Contract & Supabase',
  },
  sector_concentration: {
    is_concentrated: false,
    sector: '',
    percentage: 0,
    message: 'No investments yet. Start investing to build your portfolio.',
  },
  holdings: [],
};

export const portfolioService = {
  async getPortfolio() {
    try {
      const response = await api.get<ApiResponse<any>>('/portfolio');
      if (response.data?.data && response.data.data.holdings && response.data.data.holdings.length > 0) {
        return response.data.data;
      }
      // If API returns valid but empty data, return it as-is (real empty state)
      return response.data?.data || EMPTY_PORTFOLIO;
    } catch {
      // On network/API error, return empty portfolio instead of fake demo data
      return EMPTY_PORTFOLIO;
    }
  },
};
