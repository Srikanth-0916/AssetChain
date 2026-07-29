import api from './api';

export interface AIResponse {
  success: boolean;
  data: any;
}

export const aiService = {
  async chat(prompt: string, budget?: number, riskPreference?: 'low' | 'medium' | 'high') {
    const { data } = await api.post('/ai/chat', { prompt, budget, risk_preference: riskPreference });
    return data.data;
  },

  async getInvestmentAdvice(budget: number, riskPreference: 'low' | 'medium' | 'high') {
    const { data } = await api.post('/ai/investment-advice', { budget, risk_preference: riskPreference });
    return data.data;
  },

  async analyzePortfolio() {
    const { data } = await api.post('/ai/portfolio-analysis', {});
    return data.data;
  },

  async compareProperties(assetIds: string[]) {
    const { data } = await api.post('/ai/property-comparison', { asset_ids: assetIds });
    return data.data;
  },

  async analyzeRisk(assetId: string) {
    const { data } = await api.post('/ai/risk-analysis', { asset_id: assetId });
    return data.data;
  },

  async getMarketInsights() {
    const { data } = await api.post('/ai/market-insights', {});
    return data.data;
  },

  async explainTransaction(txHash: string) {
    const { data } = await api.post('/ai/explain-transaction', { tx_hash: txHash });
    return data.data;
  },

  async daoAssistant(proposalId: string) {
    const { data } = await api.post('/ai/dao-assistant', { proposal_id: proposalId });
    return data.data;
  },

  async summarizeDocument(ipfsCid: string) {
    const { data } = await api.post('/ai/document-summary', { ipfs_cid: ipfsCid });
    return data.data;
  },
};
