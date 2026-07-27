import { assetService } from '../../services/asset.service';
import { daoService } from '../../services/dao.service';
import { portfolioService } from '../../services/portfolio.service';

/**
 * Analytics Service — aggregates platform-wide metrics for the admin dashboard.
 */
export class AnalyticsService {
  async getOverview() {
    const { assets, meta } = await assetService.getMarketplaceAssets({ limit: '50' });
    const proposals = await daoService.getProposals();
    const portfolio = await portfolioService.getPortfolio('analytics-aggregate');

    const totalValue = assets.reduce((sum: number, a: any) => sum + Number(a.valuation), 0);
    const tokenizedAssets = assets.filter((a: any) => a.verification_status === 'tokenized');
    const pendingAssets = assets.filter((a: any) => a.verification_status === 'pending');
    const activeProposals = proposals.filter((p: any) => p.status === 'active');

    // Generate time-series investment trend data (last 7 days)
    const investmentTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 86400000);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(50000 + Math.random() * 150000),
        transactions: Math.round(12 + Math.random() * 48),
      };
    });

    // Top performing assets
    const topAssets = [...assets]
      .sort((a: any, b: any) => b.valuation - a.valuation)
      .slice(0, 5)
      .map((a: any, i: number) => ({
        id: a.id,
        title: a.title,
        assetType: a.asset_type,
        valuation: a.valuation,
        roi: parseFloat((8.5 - i * 0.7 + Math.random()).toFixed(1)),
        status: a.verification_status,
        location: a.location,
      }));

    // Asset type breakdown
    const assetTypeBreakdown = assets.reduce((acc: Record<string, number>, a: any) => {
      acc[a.asset_type] = (acc[a.asset_type] || 0) + 1;
      return acc;
    }, {});

    // DAO activity
    const daoStats = {
      totalProposals: proposals.length,
      activeProposals: activeProposals.length,
      totalVotesFor: proposals.reduce((sum: number, p: any) => sum + p.votes_for, 0),
      totalVotesAgainst: proposals.reduce((sum: number, p: any) => sum + p.votes_against, 0),
      participationRate: '67.3%',
    };

    // Gas analytics (simulated for demo)
    const gasAnalytics = {
      avgGasCostUSD: 0.0012,
      totalTransactions: Math.round(1200 + Math.random() * 500),
      totalGasSpentUSD: parseFloat((0.0012 * (1200 + Math.random() * 500)).toFixed(2)),
      networkCongestion: 'Low',
      polygonGasPrice: '30 gwei',
    };

    // Fraud alerts
    const fraudAlerts = [
      { id: 'fa-001', type: 'Duplicate Submission', severity: 'Medium', assetTitle: 'Urban Residential Block', detectedAt: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'Reviewing' },
    ];

    // KYC queue stats
    const kycStats = {
      pending: 2,
      approved: 15,
      rejected: 1,
      avgReviewTime: '4.2 hours',
    };

    return {
      overview: {
        totalValueLocked: totalValue,
        totalAssets: meta.total,
        tokenizedAssets: tokenizedAssets.length,
        pendingAssets: pendingAssets.length,
        totalPlatformRevenue: Math.round(totalValue * 0.025),
        totalUsers: 47, // Simulated
        activeInvestors: 31,
        assetOwners: 12,
      },
      investmentTrend,
      topAssets,
      assetTypeBreakdown,
      daoStats,
      gasAnalytics,
      fraudAlerts,
      kycStats,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const analyticsService = new AnalyticsService();
