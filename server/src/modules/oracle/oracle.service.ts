/**
 * Oracle Service — Bridges off-chain data (rental income, property prices) to smart contracts.
 * In production: use Chainlink or custom oracle nodes.
 * In demo mode: simulates price feeds for tokenized assets.
 */
export interface OracleFeed {
  assetId: string;
  rentalIncomeUSD: number;
  propertyValueUSD: number;
  occupancyRate: number;
  lastUpdated: string;
  source: string;
}

const feedStore = new Map<string, OracleFeed>();

export class OracleService {
  /**
   * Push a simulated rental income update for an asset.
   * In production: this would be called by a Chainlink node.
   */
  async updateFeed(assetId: string, rentalIncomeUSD: number, propertyValueUSD: number): Promise<OracleFeed> {
    const feed: OracleFeed = {
      assetId,
      rentalIncomeUSD,
      propertyValueUSD,
      occupancyRate: Math.round(80 + Math.random() * 18),
      lastUpdated: new Date().toISOString(),
      source: 'AssetChain Oracle Node v1.0',
    };
    feedStore.set(assetId, feed);
    return feed;
  }

  /**
   * Get the latest oracle feed for an asset.
   */
  getFeed(assetId: string): OracleFeed | null {
    return feedStore.get(assetId) || null;
  }

  /**
   * Simulate oracle updates for all tracked assets.
   * In production: called by a cron job every 24 hours.
   */
  async simulateOracleUpdates(assetIds: string[]): Promise<OracleFeed[]> {
    return Promise.all(
      assetIds.map((id) => this.updateFeed(
        id,
        Math.round(5000 + Math.random() * 15000),
        Math.round(500000 + Math.random() * 4500000)
      ))
    );
  }
}

export const oracleService = new OracleService();
