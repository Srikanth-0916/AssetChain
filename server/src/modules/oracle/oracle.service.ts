/**
 * Oracle Service — Bridges off-chain data (rental income, property prices) to smart contracts.
 *
 * In production: Replace ASSET_TYPE_YIELDS with real Chainlink Data Feeds:
 *   https://docs.chain.link/data-feeds/price-feeds/addresses/?network=polygon-amoy
 *
 * Current implementation: deterministic per-asset-type yield estimates with
 * occupancy-adjusted returns. This replaces the previously hardcoded 7.8% constant
 * used everywhere in the AI agent.
 */

export interface OracleFeed {
  assetId: string;
  rentalIncomeUSD: number;
  propertyValueUSD: number;
  occupancyRate: number;
  lastUpdated: string;
  source: string;
}

export interface YieldEstimate {
  baseYieldPercent: number;       // Annual yield % for this asset type
  occupancyAdjusted: number;      // Adjusted for occupancy rate
  source: 'oracle_feed' | 'asset_type_estimate';
  assetType: string;
  note: string;
}

// ─── Per-asset-type yield estimates (replaces hardcoded 7.8%) ─────────────────
// Based on RWA market benchmarks. In production: replace with Chainlink Automation.
const ASSET_TYPE_YIELDS: Record<string, number> = {
  commercial_property:    8.5,   // Grade-A office: 7-10% typical
  residential_real_estate: 6.2,  // Residential rental: 5-7% typical
  agricultural_land:      5.5,   // Agriculture: 4-7% typical
  renewable_energy:       9.8,   // PPA-backed solar/wind: 8-12% typical
  artwork:                4.0,   // Art: 3-5% appreciation yield
  luxury_collectibles:    5.0,   // Luxury goods: 4-6% typical
  commercial_equipment:   7.5,   // Equipment lease: 6-9% typical
  default:                7.0,   // Conservative blended fallback
};

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
   * Get yield estimate for an asset type, optionally adjusted by occupancy.
   * This replaces the hardcoded 7.8% constant in agent.service.ts.
   *
   * @param assetType  - The asset type string (e.g. 'commercial_property')
   * @param assetId    - Optional: if oracle feed exists for this asset, use its occupancy
   * @param occupancyOverride - Optional: explicit occupancy % (0-100) to adjust yield
   */
  getYieldEstimate(
    assetType: string,
    assetId?: string,
    occupancyOverride?: number
  ): YieldEstimate {
    const baseYield = ASSET_TYPE_YIELDS[assetType] ?? ASSET_TYPE_YIELDS.default;

    // Use oracle feed occupancy if available, otherwise use override or 85% assumption
    const feed = assetId ? feedStore.get(assetId) : null;
    const occupancy = occupancyOverride ?? feed?.occupancyRate ?? 85;

    // Occupancy adjustment: linear scale. 100% occupancy = full yield; 0% = 0 yield
    const occupancyFactor = Math.max(0, Math.min(100, occupancy)) / 100;
    const adjustedYield = Number((baseYield * (0.6 + 0.4 * occupancyFactor)).toFixed(2));

    return {
      baseYieldPercent: baseYield,
      occupancyAdjusted: adjustedYield,
      source: feed ? 'oracle_feed' : 'asset_type_estimate',
      assetType,
      note: feed
        ? `Based on oracle feed data (occupancy: ${occupancy}%)`
        : `Based on ${assetType} market benchmark (assumed ${occupancy}% occupancy). Not financial advice.`,
    };
  }

  /**
   * Simulate oracle updates for all tracked assets.
   * In production: called by a Chainlink Automation cron job every 24 hours.
   */
  async simulateOracleUpdates(assetIds: string[]): Promise<OracleFeed[]> {
    return Promise.all(
      assetIds.map((id) =>
        this.updateFeed(
          id,
          Math.round(5000 + Math.random() * 15000),
          Math.round(500000 + Math.random() * 4500000)
        )
      )
    );
  }
}

export const oracleService = new OracleService();
