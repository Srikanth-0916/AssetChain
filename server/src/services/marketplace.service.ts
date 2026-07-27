import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { NotFoundError, UnprocessableError } from '../utils/errors';

export class MarketplaceService {
  /**
   * Record primary token purchase.
   */
  async buyPrimaryTokens(
    userId: string,
    data: { asset_id: string; quantity: number; transaction_hash: string }
  ) {
    const { data: asset } = await supabaseAdmin
      .from('assets')
      .select('id, token_price, verification_status')
      .eq('id', data.asset_id)
      .single();

    if (!asset) throw new NotFoundError('Asset');
    if (asset.verification_status !== 'tokenized') {
      throw new UnprocessableError('Asset is not tokenized');
    }

    const totalAmount = data.quantity * Number(asset.token_price);

    // Record transaction
    const { data: tx, error: txErr } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: uuidv4(),
        tx_hash: data.transaction_hash,
        asset_id: data.asset_id,
        user_id: userId,
        amount: totalAmount,
        token_quantity: data.quantity,
        token_price: asset.token_price,
        type: 'purchase',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txErr) throw new Error(`Failed to log transaction: ${txErr.message}`);

    // Update or insert investment record
    const { data: existingInvestment } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .eq('asset_id', data.asset_id)
      .single();

    if (existingInvestment) {
      const newTokens = existingInvestment.tokens_owned + data.quantity;
      const newAmount = Number(existingInvestment.investment_amount) + totalAmount;
      const avgPrice = newAmount / newTokens;

      await supabaseAdmin
        .from('investments')
        .update({
          tokens_owned: newTokens,
          investment_amount: newAmount,
          average_buy_price: avgPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInvestment.id);
    } else {
      await supabaseAdmin.from('investments').insert({
        id: uuidv4(),
        user_id: userId,
        asset_id: data.asset_id,
        tokens_owned: data.quantity,
        investment_amount: totalAmount,
        average_buy_price: asset.token_price,
        transaction_hash: data.transaction_hash,
      });
    }

    return tx;
  }
}

export const marketplaceService = new MarketplaceService();
