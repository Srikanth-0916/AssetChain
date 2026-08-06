import { supabaseAdmin } from '../config/database';
import { indexedEventStore } from '../modules/indexer/event.indexer';

export interface SectorConcentrationInfo {
  is_concentrated: boolean;
  sector: string;
  percentage: number;
  message?: string;
}

export class PortfolioService {
  async getPortfolio(userId: string, walletAddress?: string) {
    // ── 1. Load on-chain events for wallet-derived data ──────────────────────
    const { events } = indexedEventStore.getAll(1, 100);
    const tokenPurchaseEvents = events.filter((e) => e.eventName === 'TokensPurchased');
    const treasuryClaimEvents = events.filter((e) => e.eventName === 'DividendClaimed');
    const governanceVoteEvents = events.filter((e) => e.eventName === 'VoteCast');

    let walletDividendsClaimed = 0;
    const governanceVotesCount = governanceVoteEvents.length;

    treasuryClaimEvents.forEach((e) => {
      if (!walletAddress || e.args['claimant']?.toLowerCase() === walletAddress.toLowerCase()) {
        walletDividendsClaimed += Number(e.args['amount'] || 0);
      }
    });

    // ── 2. Load real investments from Supabase for this user ─────────────────
    let holdings: any[] = [];
    try {
      const { data: investmentRows, error } = await supabaseAdmin
        .from('investments')
        .select(`
          id,
          user_id,
          asset_id,
          tokens_owned,
          average_buy_price,
          investment_amount,
          current_value,
          total_roi_percent,
          profit_earned,
          status,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.warn('[PortfolioService] ⚠️ Supabase investments query warning:', error.message);
      } else if (investmentRows && investmentRows.length > 0) {
        // Enrich each investment with asset data
        for (const inv of investmentRows) {
          const { data: asset } = await supabaseAdmin
            .from('assets')
            .select('id, title, token_price, asset_type, contract_address, location, verification_status')
            .eq('id', inv.asset_id)
            .single();

          holdings.push({
            id: inv.id,
            user_id: inv.user_id,
            asset_id: inv.asset_id,
            tokens_owned: inv.tokens_owned,
            investment_amount: inv.investment_amount,
            average_buy_price: inv.average_buy_price,
            current_value: inv.current_value || inv.investment_amount,
            profit_loss: inv.profit_earned || 0,
            total_roi_percent: inv.total_roi_percent || 0,
            unclaimed_dividends: 0, // Will be enriched from on-chain data when available
            claimed_dividends: walletDividendsClaimed,
            governance_votes_participated: governanceVotesCount,
            blockchain_source: 'Polygon Amoy Smart Contract via Supabase',
            asset: asset ? {
              id: asset.id,
              title: asset.title,
              token_price: asset.token_price,
              asset_type: asset.asset_type,
              location: asset.location,
              contract_address: asset.contract_address,
            } : {
              id: inv.asset_id,
              title: 'Asset',
              token_price: inv.average_buy_price,
              asset_type: 'Real World Asset',
              contract_address: null,
            },
          });
        }
      }
    } catch (e: any) {
      console.warn('[PortfolioService] ⚠️ Portfolio load catch:', e.message);
    }

    // ── 3. Compute summary metrics ────────────────────────────────────────────
    const totalInvested = holdings.reduce((sum, item) => sum + (item.investment_amount || 0), 0);
    const currentValue = holdings.reduce((sum, item) => sum + (item.current_value || 0), 0);
    const totalDividends = holdings.reduce((sum, item) => sum + (item.unclaimed_dividends || 0), 0);
    const totalProfitLoss = holdings.reduce((sum, item) => sum + (item.profit_loss || 0), 0);

    // ── 4. Compute sector concentration ──────────────────────────────────────
    const sectorValues: Record<string, number> = {};
    for (const h of holdings) {
      const type = h.asset?.asset_type || 'Other';
      sectorValues[type] = (sectorValues[type] || 0) + (h.current_value || 0);
    }

    let concentration: SectorConcentrationInfo = {
      is_concentrated: false,
      sector: '',
      percentage: 0,
    };

    if (currentValue > 0 && holdings.length >= 2) {
      for (const [sector, val] of Object.entries(sectorValues)) {
        const pct = Math.round((val / currentValue) * 100);
        if (pct >= 50) {
          concentration = {
            is_concentrated: true,
            sector,
            percentage: pct,
            message: `You're concentrated in ${sector} (${pct}% of portfolio) — consider diversifying into other asset classes.`,
          };
          break;
        }
      }
    }

    return {
      summary: {
        total_invested: totalInvested,
        current_value: currentValue,
        total_profit_loss: totalProfitLoss,
        unclaimed_dividends: totalDividends,
        claimed_dividends: walletDividendsClaimed,
        total_assets: holdings.length,
        governance_votes: governanceVotesCount,
        data_source: holdings.length > 0
          ? 'Supabase Investments + Polygon Amoy On-Chain Events'
          : 'No investments found — start investing in the Marketplace',
      },
      sector_concentration: concentration,
      holdings,
    };
  }
}

export const portfolioService = new PortfolioService();
