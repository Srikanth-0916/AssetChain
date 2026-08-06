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

    const proposalPayload = {
      id: uuidv4(),
      asset_id: data.asset_id || null,
      title: data.title,
      description: data.description,
      created_by: adminId,
      voting_start_at: startDate.toISOString(),
      voting_end_at: endDate.toISOString(),
      status: 'active',
      votes_for: 0,
      votes_against: 0,
      quorum_threshold: data.quorum_threshold,
      created_at: startDate.toISOString(),
    };

    const { data: inserted, error } = await supabaseAdmin
      .from('dao_proposals')
      .insert(proposalPayload)
      .select()
      .single();

    if (error) {
      console.error('[DAOService] ❌ createProposal Supabase error:', error.message);
      throw new Error(`Failed to create DAO proposal: ${error.message}`);
    }

    return {
      ...(inserted ?? proposalPayload),
      created_by_user: { full_name: 'Platform Admin' },
    };
  }

  async getProposals(assetId?: string) {
    let query = supabaseAdmin
      .from('dao_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[DAOService] ⚠️ getProposals error:', error.message);
      return [];
    }

    return (data || []).map((p: any) => ({
      ...p,
      // Normalize field names to match what was previously returned
      start_date: p.voting_start_at,
      end_date: p.voting_end_at,
      created_by_user: { full_name: 'Platform Admin' },
    }));
  }

  async castVote(
    voterId: string,
    proposalId: string,
    data: { vote: 'for' | 'against' | 'abstain'; transaction_hash: string }
  ) {
    // 1. Fetch proposal
    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('dao_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchErr || !proposal) {
      throw new NotFoundError('Proposal');
    }

    if (proposal.status !== 'active') {
      throw new UnprocessableError('This proposal is no longer accepting votes.');
    }

    const votingPower = 100;

    // 2. Insert vote record
    const voteRecord = {
      id: uuidv4(),
      proposal_id: proposalId,
      voter_id: voterId,
      vote: data.vote,
      voting_power: votingPower,
      tx_hash: data.transaction_hash,
      created_at: new Date().toISOString(),
    };

    const { error: voteErr } = await supabaseAdmin
      .from('dao_votes')
      .insert(voteRecord);

    if (voteErr) {
      console.warn('[DAOService] ⚠️ dao_votes insert warning:', voteErr.message);
    }

    // 3. Update proposal vote tallies
    const updatePayload: Record<string, any> = {};
    if (data.vote === 'for') {
      updatePayload.votes_for = (proposal.votes_for || 0) + votingPower;
    } else if (data.vote === 'against') {
      updatePayload.votes_against = (proposal.votes_against || 0) + votingPower;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from('dao_proposals')
        .update(updatePayload)
        .eq('id', proposalId);

      if (updateErr) {
        console.warn('[DAOService] ⚠️ proposal vote tally update warning:', updateErr.message);
      }
    }

    return voteRecord;
  }
}

export const daoService = new DAOService();
