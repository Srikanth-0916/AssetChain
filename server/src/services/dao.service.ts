import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { NotFoundError, UnprocessableError } from '../utils/errors';

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

    const { data: proposal, error } = await supabaseAdmin
      .from('dao_proposals')
      .insert({
        id: uuidv4(),
        asset_id: data.asset_id || null,
        title: data.title,
        description: data.description,
        created_by: adminId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        quorum_threshold: data.quorum_threshold,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create proposal: ${error.message}`);
    return proposal;
  }

  async getProposals(assetId?: string) {
    let query = supabaseAdmin
      .from('dao_proposals')
      .select('*, created_by_user:users!created_by(full_name)');

    if (assetId) query = query.eq('asset_id', assetId);

    const { data: proposals, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch proposals: ${error.message}`);
    return proposals || [];
  }

  async castVote(
    voterId: string,
    proposalId: string,
    data: { vote: 'for' | 'against' | 'abstain'; transaction_hash: string }
  ) {
    const { data: proposal } = await supabaseAdmin
      .from('dao_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (!proposal) throw new NotFoundError('Proposal');
    if (proposal.status !== 'active') throw new UnprocessableError('Proposal is not active');

    // Check duplicate vote
    const { data: existing } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('proposal_id', proposalId)
      .eq('voter_id', voterId)
      .single();

    if (existing) throw new UnprocessableError('You have already voted on this proposal');

    // Record vote (voting power defaults to 1 for demo/MVP or user tokens)
    const votingPower = 100;

    const { data: vote, error } = await supabaseAdmin
      .from('votes')
      .insert({
        id: uuidv4(),
        proposal_id: proposalId,
        voter_id: voterId,
        vote: data.vote,
        voting_power: votingPower,
        tx_hash: data.transaction_hash,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to record vote: ${error.message}`);

    // Increment tally
    const isFor = data.vote === 'for';
    await supabaseAdmin
      .from('dao_proposals')
      .update({
        votes_for: isFor ? proposal.votes_for + votingPower : proposal.votes_for,
        votes_against: !isFor ? proposal.votes_against + votingPower : proposal.votes_against,
      })
      .eq('id', proposalId);

    return vote;
  }
}

export const daoService = new DAOService();
