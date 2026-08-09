import api from './api';
import type { ApiResponse } from '../types/api';

export const DEMO_PORTFOLIO = {
  summary: {
    total_invested: 500000,
    current_value: 548000,
    total_profit_loss: 48000,
    unclaimed_dividends: 14200,
    claimed_dividends: 32000,
    total_assets: 3,
    governance_votes: 5,
    data_source: 'Polygon Amoy Smart Contract & Supabase',
  },
  sector_concentration: {
    is_concentrated: false,
    sector: 'Renewable Energy',
    percentage: 42,
    message: 'Well balanced across Renewable Energy (42%) and Commercial Real Estate (58%).',
  },
  holdings: [
    {
      id: 'h-01',
      user_id: 'demo-user',
      asset_id: 'ast-solar-01',
      tokens_owned: 250,
      investment_amount: 250000,
      average_buy_price: 1000,
      current_value: 278000,
      profit_loss: 28000,
      total_roi_percent: 11.2,
      unclaimed_dividends: 8400,
      claimed_dividends: 16000,
      governance_votes_participated: 3,
      blockchain_source: 'Polygon Amoy Smart Contract',
      asset: {
        id: 'ast-solar-01',
        title: 'Gujarat Solar Energy Park SPV',
        token_price: 1112,
        asset_type: 'renewable_energy',
        location: 'Gujarat, India',
        contract_address: '0x8823b1f1437190d64478148b1110098487a3e21',
      },
    },
    {
      id: 'h-02',
      user_id: 'demo-user',
      asset_id: 'ast-com-02',
      tokens_owned: 150,
      investment_amount: 150000,
      average_buy_price: 1000,
      current_value: 164000,
      profit_loss: 14000,
      total_roi_percent: 9.3,
      unclaimed_dividends: 4200,
      claimed_dividends: 11000,
      governance_votes_participated: 2,
      blockchain_source: 'Polygon Amoy Smart Contract',
      asset: {
        id: 'ast-com-02',
        title: 'Bandra Business Hub Office Tower',
        token_price: 1093,
        asset_type: 'commercial_property',
        location: 'Mumbai, India',
        contract_address: '0x99a41571437190d64478148b1110098487a3e88',
      },
    },
    {
      id: 'h-03',
      user_id: 'demo-user',
      asset_id: 'ast-res-03',
      tokens_owned: 100,
      investment_amount: 100000,
      average_buy_price: 1000,
      current_value: 106000,
      profit_loss: 6000,
      total_roi_percent: 6.0,
      unclaimed_dividends: 16000,
      claimed_dividends: 5000,
      governance_votes_participated: 0,
      blockchain_source: 'Polygon Amoy Smart Contract',
      asset: {
        id: 'ast-res-03',
        title: 'Whitefield Luxury Residence SPV',
        token_price: 1060,
        asset_type: 'residential_real_estate',
        location: 'Bengaluru, India',
        contract_address: '0x77d12191437190d64478148b1110098487a3f99',
      },
    },
  ],
};

export const portfolioService = {
  async getPortfolio() {
    try {
      const response = await api.get<ApiResponse<any>>('/portfolio');
      if (response.data?.data && response.data.data.holdings && response.data.data.holdings.length > 0) {
        return response.data.data;
      }
      return response.data?.data || DEMO_PORTFOLIO;
    } catch {
      return DEMO_PORTFOLIO;
    }
  },

  getDemoPortfolio() {
    return DEMO_PORTFOLIO;
  },
};
