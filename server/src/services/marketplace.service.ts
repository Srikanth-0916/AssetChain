import { v4 as uuidv4 } from 'uuid';
import { assetService } from './asset.service';
import { supabaseAdmin } from '../config/database';

export class MarketplaceService {
  async buyPrimaryTokens(
    userId: string,
    data: { asset_id: string; quantity: number; transaction_hash: string }
  ) {
    const asset = await assetService.getAssetById(data.asset_id);
    const totalAmount = data.quantity * Number(asset.token_price || 100);

    const transactionId = uuidv4();
    const confirmedAt = new Date().toISOString();

    // 1. Insert transaction record into Supabase
    const { error: txError } = await supabaseAdmin.from('transactions').insert({
      id: transactionId,
      tx_hash: data.transaction_hash,
      asset_id: data.asset_id,
      user_id: userId,
      amount: totalAmount,
      token_quantity: data.quantity,
      token_price: asset.token_price,
      type: 'purchase',
      status: 'confirmed',
      confirmed_at: confirmedAt,
    });

    if (txError) {
      console.error('[MarketplaceService] ❌ Failed to insert transaction:', txError.message);
      throw new Error(`Transaction failed: ${txError.message}`);
    }

    // 2. Fetch existing investment to update or insert a new one
    const { data: existingInvestment } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .eq('asset_id', data.asset_id)
      .maybeSingle();

    if (existingInvestment) {
      const newTokensOwned = Number(existingInvestment.tokens_owned) + data.quantity;
      const newInvestmentAmount = Number(existingInvestment.investment_amount) + totalAmount;
      const newAverageBuyPrice = newInvestmentAmount / newTokensOwned;

      const { error: invError } = await supabaseAdmin
        .from('investments')
        .update({
          tokens_owned: newTokensOwned,
          investment_amount: newInvestmentAmount,
          average_buy_price: newAverageBuyPrice,
          current_value: newInvestmentAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInvestment.id);

      if (invError) {
        console.error('[MarketplaceService] ❌ Failed to update investment:', invError.message);
      }
    } else {
      const { error: invError } = await supabaseAdmin.from('investments').insert({
        id: uuidv4(),
        user_id: userId,
        asset_id: data.asset_id,
        tokens_owned: data.quantity,
        average_buy_price: asset.token_price,
        investment_amount: totalAmount,
        current_value: totalAmount,
        status: 'active',
        created_at: confirmedAt,
        updated_at: confirmedAt,
      });

      if (invError) {
        console.error('[MarketplaceService] ❌ Failed to create investment:', invError.message);
      }
    }

    // 3. Recalculate and update portfolio cache for the user
    const { data: userInvestments } = await supabaseAdmin
      .from('investments')
      .select('investment_amount, current_value')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (userInvestments) {
      const totalInvested = userInvestments.reduce((sum, inv) => sum + Number(inv.investment_amount), 0);
      const currentMarketValue = userInvestments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
      const profitLoss = currentMarketValue - totalInvested;
      const roiPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
      const activeAssetsCount = userInvestments.length;

      const { error: cacheError } = await supabaseAdmin
        .from('portfolio_cache')
        .upsert({
          user_id: userId,
          total_invested: totalInvested,
          current_market_value: currentMarketValue,
          total_profit_loss: profitLoss,
          total_roi_percent: roiPercent,
          active_assets_count: activeAssetsCount,
          last_updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (cacheError) {
        console.error('[MarketplaceService] ❌ Failed to update portfolio cache:', cacheError.message);
      }
    }

    return {
      id: transactionId,
      tx_hash: data.transaction_hash,
      asset_id: data.asset_id,
      user_id: userId,
      amount: totalAmount,
      token_quantity: data.quantity,
      token_price: asset.token_price,
      type: 'purchase',
      status: 'confirmed',
      confirmed_at: confirmedAt,
    };
  }
}

export const marketplaceService = new MarketplaceService();
