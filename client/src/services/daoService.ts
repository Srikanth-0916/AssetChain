import api from './api';
import type { ApiResponse } from '../types/api';

export interface CreateProposalPayload {
  asset_id?: string;
  title: string;
  description: string;
  duration_days: number;
  quorum_threshold: number;
}

export interface CastVotePayload {
  vote: 'for' | 'against' | 'abstain';
  transaction_hash: string;
}

export const daoService = {
  async getProposals(asset_id?: string) {
    const response = await api.get<ApiResponse<any[]>>('/dao/proposals', { params: { asset_id } });
    return response.data.data;
  },

  async createProposal(data: CreateProposalPayload) {
    const response = await api.post<ApiResponse<any>>('/dao/proposals', data);
    return response.data.data;
  },

  async castVote(proposalId: string, data: CastVotePayload) {
    const response = await api.post<ApiResponse<any>>(`/dao/proposals/${proposalId}/vote`, data);
    return response.data.data;
  },
};
