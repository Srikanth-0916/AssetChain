import { v4 as uuidv4 } from 'uuid';
import { assetService } from './asset.service';

export class MarketplaceService {
  async buyPrimaryTokens(
    userId: string,
    data: { asset_id: string; quantity: number; transaction_hash: string }
  ) {
    const asset = await assetService.getAssetById(data.asset_id);
    const totalAmount = data.quantity * Number(asset.token_price || 100);

    return {
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
    };
  }
}

export const marketplaceService = new MarketplaceService();
