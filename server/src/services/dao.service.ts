import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { NotFoundError, UnprocessableError } from '../utils/errors';

const localProposalsStore: Map<string, any> = new Map();

// Seed initial DAO proposals
const initialProposals = [
  {
    id: 'prop-demo-uuid-001',
    asset_id: 'asset-demo-uuid-001',
    title: 'Install Rooftop Solar Panels & EV Charging Stations',
    description: 'Upgrade Manhattan Commercial Plaza with 200kW rooftop solar system and 12 dual-port EV chargers to increase ESG rating and tenant retention.',
    created_by: 'admin-demo-uuid-001',
    start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    votes_for: 1850,
    votes_against: 120,
    quorum_threshold: 1000,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_by_user: { full_name: 'Platform Admin' },
  },
  {
    id: 'prop-demo-uuid-002',
    asset_id: 'asset-demo-uuid-002',
    title: 'Q3 Dividend Distribution Schedule Approval',
    description: 'Approve early distribution of Q3 operational yield ($45,000 USDC) to Solar Farm Alpha 1 token holders.',
    created_by: 'admin-demo-uuid-001',
    start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    votes_for: 2400,
    votes_against: 0,
    quorum_threshold: 1000,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_by_user: { full_name: 'Platform Admin' },
  },
];

for (const p of initialProposals) {
  localProposalsStore.set(p.id, p);
}

export class DAOService {
  async createProposal(
    adminId: string,
    data: {
      asset_id?: string;
      title: string;
      description: string;
      duration_days: number;
      quorum_threshold: number;
    }
  ) {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + data.duration_days * 24 * 60 * 60 * 1000);

    const proposal = {
      id: uuidv4(),
      asset_id: data.asset_id || null,
      title: data.title,
      description: data.description,
      created_by: adminId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      votes_for: 0,
      votes_against: 0,
      quorum_threshold: data.quorum_threshold,
      created_at: startDate.toISOString(),
      created_by_user: { full_name: 'Platform Admin' },
    };

    localProposalsStore.set(proposal.id, proposal);
    return proposal;
  }

  async getProposals(assetId?: string) {
    let list = Array.from(localProposalsStore.values());
    if (assetId) {
      list = list.filter((p) => p.asset_id === assetId);
    }
    return list;
  }

  async castVote(
    voterId: string,
    proposalId: string,
    data: { vote: 'for' | 'against' | 'abstain'; transaction_hash: string }
  ) {
    const proposal = localProposalsStore.get(proposalId);
    if (!proposal) throw new NotFoundError('Proposal');

    const votingPower = 100;

    if (data.vote === 'for') {
      proposal.votes_for += votingPower;
    } else if (data.vote === 'against') {
      proposal.votes_against += votingPower;
    }

    localProposalsStore.set(proposalId, proposal);

    return {
      id: uuidv4(),
      proposal_id: proposalId,
      voter_id: voterId,
      vote: data.vote,
      voting_power: votingPower,
      tx_hash: data.transaction_hash,
    };
  }
}

export const daoService = new DAOService();
