import { supabaseAdmin } from '../config/database';

export class PortfolioService {
  async getPortfolio(userId: string) {
    const { data: investments, error } = await supabaseAdmin
      .from('investments')
      .select('*, asset:assets(*)')
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to fetch portfolio: ${error.message}`);

    const list = investments || [];
    let totalInvested = 0;
    let currentValue = 0;

    const holdings = list.map((inv: any) => {
      const tokens = Number(inv.tokens_owned || 0);
      const buyPrice = Number(inv.average_buy_price || 0);
      const currentPrice = Number(inv.asset?.token_price || buyPrice);
      const invAmount = Number(inv.investment_amount || tokens * buyPrice);
      const val = tokens * currentPrice;

      totalInvested += invAmount;
      currentValue += val;

      return {
        ...inv,
        tokens_owned: tokens,
        investment_amount: invAmount,
        current_value: val,
        profit_loss: val - invAmount,
      };
    });

    return {
      summary: {
        total_invested: totalInvested,
        current_value: currentValue,
        total_profit_loss: currentValue - totalInvested,
        total_assets: holdings.length,
      },
      holdings,
    };
  }
}

export const portfolioService = new PortfolioService();
