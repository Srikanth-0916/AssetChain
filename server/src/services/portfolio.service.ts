export interface SectorConcentrationInfo {
  is_concentrated: boolean;
  sector: string;
  percentage: number;
  message?: string;
}

export class PortfolioService {
  async getPortfolio(userId: string) {
    const holdings = [
      {
        id: 'inv-demo-001',
        user_id: userId,
        asset_id: 'asset-demo-uuid-001',
        tokens_owned: 40,
        investment_amount: 10000,
        average_buy_price: 250,
        current_value: 11000,
        profit_loss: 1000,
        unclaimed_dividends: 350,
        asset: {
          id: 'asset-demo-uuid-001',
          title: 'Manhattan Commercial Plaza',
          token_price: 275,
          asset_type: 'Commercial Real Estate',
          contract_address: '0x1111111111111111111111111111111111111111',
        },
      },
      {
        id: 'inv-demo-002',
        user_id: userId,
        asset_id: 'asset-demo-uuid-002',
        tokens_owned: 35,
        investment_amount: 4200,
        average_buy_price: 120,
        current_value: 4550,
        profit_loss: 350,
        unclaimed_dividends: 120,
        asset: {
          id: 'asset-demo-uuid-002',
          title: 'Solar Farm Alpha 1',
          token_price: 130,
          asset_type: 'Renewable Energy',
          contract_address: '0x2222222222222222222222222222222222222222',
        },
      },
    ];

    const totalInvested = holdings.reduce((sum, item) => sum + item.investment_amount, 0);
    const currentValue = holdings.reduce((sum, item) => sum + item.current_value, 0);
    const totalDividends = holdings.reduce((sum, item) => sum + item.unclaimed_dividends, 0);

    // Compute sector concentration logic
    const sectorValues: Record<string, number> = {};
    for (const h of holdings) {
      const type = h.asset.asset_type || 'Other';
      sectorValues[type] = (sectorValues[type] || 0) + h.current_value;
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
        total_profit_loss: currentValue - totalInvested,
        unclaimed_dividends: totalDividends,
        total_assets: holdings.length,
      },
      sector_concentration: concentration,
      holdings,
    };
  }
}

export const portfolioService = new PortfolioService();
