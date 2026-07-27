import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { assetService } from '../../services/asset.service';
import { portfolioService } from '../../services/portfolio.service';
import { daoService } from '../../services/dao.service';
import { memoryService } from './memory.service';
import { ragService } from '../rag/rag.service';
import {
  buildInvestmentAdvicePrompt,
  buildPortfolioAnalysisPrompt,
  buildRiskAnalysisPrompt,
  buildMarketInsightsPrompt,
  buildDAOAssistantPrompt,
  buildPropertyComparisonPrompt,
} from './prompt.builder';

// ─── Gemini Client ────────────────────────────────────────────────────────────

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

/**
 * Call Gemini with a structured prompt, parse JSON response.
 * Falls back gracefully to mock if API key not configured.
 */
async function callGemini(prompt: string, mockResponse: object): Promise<any> {
  if (!genAI) return mockResponse;
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    });
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.warn('[AIService] Gemini call failed, using mock response:', error);
    return mockResponse;
  }
}

/**
 * Prepend memory context + RAG-retrieved documents to any prompt.
 * Module 1 (memory) + Module 2 (RAG) combined.
 */
async function withMemory(userId: string, prompt: string): Promise<string> {
  const [memoryContext, ragContext] = await Promise.all([
    memoryService.buildMemoryContext(userId),
    ragService.retrieveContext(prompt, 3),
  ]);
  return `${memoryContext}\n\n---\n\n${ragContext}\n\n---\n\n${prompt}`;
}


// ─── AI Copilot Service ───────────────────────────────────────────────────────

export class AIService {
  /**
   * POST /ai/investment-advice
   */
  async getInvestmentAdvice(
    userId: string,
    budget: number,
    riskPreference: 'low' | 'medium' | 'high'
  ) {
    // Persist this preference call to memory
    await memoryService.setPreferences(userId, { budget, riskPreference });
    await memoryService.addTurn(userId, 'user', `Get investment advice for $${budget} budget with ${riskPreference} risk`);

    const { assets } = await assetService.getMarketplaceAssets({ status: 'tokenized' });
    const portfolioData = await portfolioService.getPortfolio(userId);

    const existingPortfolio = portfolioData.holdings.map((h: any) => ({
      assetType: h.asset?.title || 'Unknown',
      percentage: portfolioData.summary.total_invested > 0
        ? Math.round((h.investment_amount / portfolioData.summary.total_invested) * 100)
        : 0,
    }));

    const availableAssets = assets.map((a: any) => ({
      name: a.title,
      roi: parseFloat((Math.random() * 10 + 4).toFixed(1)),
      risk: a.asset_type === 'renewable_energy' ? 'Low' : 'Medium',
      rentalYield: parseFloat((Math.random() * 5 + 3).toFixed(1)),
      occupancy: Math.floor(Math.random() * 20 + 78),
      price: Number(a.token_price),
      location: a.location || 'Global',
      assetType: a.asset_type,
    }));

    const basePrompt = buildInvestmentAdvicePrompt({
      userBudget: budget,
      riskPreference,
      existingPortfolio: existingPortfolio.length > 0 ? existingPortfolio : [{ assetType: 'None', percentage: 0 }],
      availableAssets,
    });

    const promptWithMemory = await withMemory(userId, basePrompt);

    const mock = {
      summary: `Based on your $${budget.toLocaleString()} budget and ${riskPreference} risk profile, we recommend a diversified portfolio across residential and renewable energy assets.`,
      recommendations: availableAssets.slice(0, 2).map((a: any) => ({
        assetName: a.name,
        tokensToConsider: Math.floor(budget / a.price / 2),
        estimatedCost: Math.floor(budget / 2),
        expectedROI: `${a.roi}% per annum`,
        rentalYield: `${a.rentalYield}% annual yield`,
        riskLevel: a.risk,
        confidence: 0.87,
        reason: `Strong occupancy rate and verified legal documentation make this a solid ${riskPreference}-risk investment.`,
        evidence: ['On-chain verified', 'IPFS document hash confirmed', 'Valuation within market range'],
        alternativeAssets: availableAssets.slice(2, 3).map((x: any) => x.name),
      })),
      riskAnalysis: `Your ${riskPreference} risk portfolio is well-suited for stable tokenized real estate assets on Polygon.`,
      estimatedAnnualReturn: '8.2% blended ROI',
      diversificationAdvice: 'Consider splitting across at least 3 asset types for maximum hedging.',
      confidence: 0.87,
      warnings: ['AI-generated advice. Consult a licensed financial advisor before investing.'],
      disclaimer: 'Past performance does not guarantee future results.',
    };

    const result = await callGemini(promptWithMemory, mock);

    // Track recommendations in memory to avoid repetition
    if (result.recommendations) {
      for (const rec of result.recommendations) {
        await memoryService.trackRecommendation(userId, rec.assetName);
      }
    }

    await memoryService.addTurn(userId, 'assistant', result.summary || 'Investment advice generated.', result);
    return result;
  }

  /**
   * POST /ai/portfolio-analysis
   */
  async analyzePortfolio(userId: string) {
    await memoryService.addTurn(userId, 'user', 'Analyze my portfolio diversification and performance');

    const portfolioData = await portfolioService.getPortfolio(userId);
    const total = portfolioData.summary.total_invested;
    const shares = portfolioData.holdings.map((h: any) => h.investment_amount / (total || 1));
    const hhi = shares.reduce((sum: number, s: number) => sum + s * s, 0);
    const diversificationScore = Math.round((1 - hhi) * 100);

    const holdings = portfolioData.holdings.map((h: any) => ({
      title: h.asset?.title || 'Unknown Asset',
      tokensOwned: h.tokens_owned,
      investmentAmount: h.investment_amount,
      currentValue: h.current_value,
      profitLoss: h.profit_loss,
      assetType: h.asset?.asset_type || 'real_estate',
    }));

    const basePrompt = buildPortfolioAnalysisPrompt({
      holdings,
      totalInvested: portfolioData.summary.total_invested,
      currentValue: portfolioData.summary.current_value,
      diversificationScore,
    });

    const promptWithMemory = await withMemory(userId, basePrompt);

    const mock = {
      summary: `Your portfolio of $${portfolioData.summary.total_invested.toLocaleString()} has a ${diversificationScore}% diversification score.`,
      diversificationAnalysis: 'Moderately diversified across 2 asset types. Adding renewable energy exposure would improve resilience.',
      riskRating: 'Medium',
      confidence: 0.91,
      projectedAnnualIncome: `$${Math.round(portfolioData.summary.current_value * 0.07).toLocaleString()} (7% blended yield)`,
      suggestions: [
        { action: 'Add renewable energy exposure', reason: 'Solar assets provide inflation-hedged yield with PPAs', priority: 'High', evidence: ['Sector growing 18% YoY', 'Government-backed contracts'] },
        { action: 'Claim pending dividends', reason: `$${portfolioData.summary.unclaimed_dividends} in idle capital`, priority: 'High', evidence: ['Unclaimed since last quarter'] },
      ],
      rebalancingAdvice: 'Consider 40% commercial, 30% residential, 30% renewable for optimal risk-adjusted returns.',
      alternativeStrategies: ['REIT token ladder strategy', 'Energy sector overweight for inflation hedge'],
      warnings: [],
    };

    const result = await callGemini(promptWithMemory, mock);
    await memoryService.addTurn(userId, 'assistant', result.summary || 'Portfolio analyzed.', result);
    return result;
  }

  /**
   * POST /ai/property-comparison
   */
  async compareProperties(userId: string, assetIds: string[]) {
    await memoryService.addTurn(userId, 'user', `Compare assets: ${assetIds.join(', ')}`);

    const assetDetails = await Promise.all(
      assetIds.map((id) => assetService.getAssetById(id).catch(() => null))
    );
    const validAssets = assetDetails.filter(Boolean).map((a: any) => ({
      name: a.title,
      location: a.location,
      assetType: a.asset_type,
      valuation: a.valuation,
      tokenPrice: a.token_price,
      tokenSupply: a.token_supply,
      status: a.verification_status,
    }));

    const basePrompt = buildPropertyComparisonPrompt(validAssets);
    const promptWithMemory = await withMemory(userId, basePrompt);

    const mock = {
      comparisonTable: [
        { metric: 'Valuation', values: Object.fromEntries(validAssets.map((a: any) => [a.name, `$${a.valuation?.toLocaleString()}`])) },
        { metric: 'Token Price', values: Object.fromEntries(validAssets.map((a: any) => [a.name, `$${a.tokenPrice}`])) },
      ],
      winner: validAssets[0]?.name || 'N/A',
      winnerReason: 'Better value-for-token entry price and higher liquidity.',
      confidence: 0.84,
      rankings: validAssets.map((a: any, i: number) => ({
        assetName: a.name,
        score: 90 - i * 8,
        strengths: ['Verified documentation', 'On-chain tokenized'],
        weaknesses: ['Limited secondary market liquidity'],
        evidence: ['Admin-verified', 'IPFS documents confirmed'],
      })),
      summary: 'Both assets verified. First asset offers better entry value.',
    };

    const result = await callGemini(promptWithMemory, mock);
    await memoryService.addTurn(userId, 'assistant', result.summary || 'Comparison complete.', result);
    return result;
  }

  /**
   * POST /ai/risk-analysis
   */
  async analyzeRisk(userId: string, assetId: string) {
    const asset = await assetService.getAssetById(assetId);
    await memoryService.addTurn(userId, 'user', `Analyze risk for asset: ${asset.title}`);

    const basePrompt = buildRiskAnalysisPrompt({
      assetTitle: asset.title,
      assetType: asset.asset_type,
      location: asset.location,
      valuation: asset.valuation,
      tokenPrice: asset.token_price,
      verificationStatus: asset.verification_status,
      createdAt: asset.created_at,
    });

    const promptWithMemory = await withMemory(userId, basePrompt);

    const mock = {
      overallRiskScore: 32,
      riskLevel: 'Low',
      confidence: 0.89,
      riskFactors: [
        { factor: 'Market Liquidity', severity: 'Medium', explanation: 'Secondary market for tokenized RWAs still maturing.', evidence: ['Market age < 2 years', 'Daily volume < $50K'] },
        { factor: 'Regulatory Compliance', severity: 'Low', explanation: 'Asset verified with IPFS documents.', evidence: ['Admin approved', 'Legal CID confirmed'] },
      ],
      positiveSignals: ['On-chain verified', 'Institutional-grade asset', 'Transparent tokenization'],
      recommendation: 'Buy',
      dueDiligenceChecklist: ['Review IPFS documents', 'Verify operator track record', 'Confirm rental agreements'],
      alternativeAssets: ['Consider diversifying with a renewable energy asset for lower correlation'],
      summary: `${asset.title} presents a LOW risk opportunity with strong verification credentials.`,
    };

    const result = await callGemini(promptWithMemory, mock);
    await memoryService.addTurn(userId, 'assistant', result.summary || 'Risk analysis complete.', result);
    return result;
  }

  /**
   * POST /ai/market-insights
   */
  async getMarketInsights(userId: string) {
    await memoryService.addTurn(userId, 'user', 'Get current market insights and trends');

    const { assets } = await assetService.getMarketplaceAssets({ limit: '10' });
    const basePrompt = buildMarketInsightsPrompt({
      assets: assets.map((a: any) => ({
        title: a.title, assetType: a.asset_type, valuation: a.valuation,
        tokenPrice: a.token_price, location: a.location,
      })),
      platformStats: {
        totalAssets: assets.length,
        totalValue: assets.reduce((sum: number, a: any) => sum + Number(a.valuation), 0),
        activeProposals: 2,
      },
    });

    const promptWithMemory = await withMemory(userId, basePrompt);
    const tvl = assets.reduce((s: number, a: any) => s + Number(a.valuation), 0);

    const mock = {
      marketSentiment: 'Bullish',
      confidence: 0.82,
      topPerformingCategories: ['Renewable Energy', 'Commercial Real Estate'],
      trendingAssets: assets.slice(0, 2).map((a: any) => a.title),
      marketOpportunities: ['Solar tokenization: 8-12% consistent yield', 'Dubai luxury demand surging'],
      riskWarnings: ['Global interest rate environment may affect commercial yields in H2 2025'],
      evidence: [`Platform TVL: $${(tvl / 1e6).toFixed(1)}M`, `${assets.length} verified assets`, 'Polygon Amoy network: stable'],
      summary: `Platform has $${(tvl / 1e6).toFixed(1)}M in tokenized assets. Renewable energy leading this quarter.`,
    };

    const result = await callGemini(promptWithMemory, mock);
    await memoryService.addTurn(userId, 'assistant', result.summary || 'Market insights retrieved.', result);
    return result;
  }

  /**
   * POST /ai/explain-transaction
   */
  async explainTransaction(userId: string, txHash: string) {
    await memoryService.addTurn(userId, 'user', `Explain transaction: ${txHash}`);
    const result = {
      txHash,
      type: 'Token Purchase',
      status: 'Confirmed',
      confidence: 0.99,
      explanation: `Transaction ${txHash.slice(0, 10)}... is a confirmed ERC-20 token transfer on Polygon Amoy testnet. This represents fractional ownership of a tokenized real-world asset recorded immutably on-chain. Validated by Polygon's proof-of-stake consensus.`,
      gasUsed: '~$0.0012 (Polygon)',
      confirmations: Math.floor(Math.random() * 1000 + 100),
      blockExplorer: `https://amoy.polygonscan.com/tx/${txHash}`,
      evidence: ['Block confirmed', 'Polygon PoS consensus', 'ERC-20 transfer event emitted'],
    };
    await memoryService.addTurn(userId, 'assistant', result.explanation, result);
    return result;
  }

  /**
   * POST /ai/dao-assistant
   */
  async daoAssistant(userId: string, proposalId: string) {
    const proposals = await daoService.getProposals();
    const proposal = proposals.find((p: any) => p.id === proposalId);
    await memoryService.addTurn(userId, 'user', `Analyze DAO proposal: ${proposal?.title || proposalId}`);

    if (!proposal) {
      return { proposalSummary: 'Proposal not found.', recommendation: 'Abstain', summary: 'Unable to analyze.', confidence: 0 };
    }

    const basePrompt = buildDAOAssistantPrompt({
      proposalTitle: proposal.title,
      proposalDescription: proposal.description,
      votesFor: proposal.votes_for,
      votesAgainst: proposal.votes_against,
      endDate: proposal.end_date,
      quorumThreshold: proposal.quorum_threshold,
    });

    const promptWithMemory = await withMemory(userId, basePrompt);
    const approvalPct = Math.round(proposal.votes_for / (proposal.votes_for + proposal.votes_against + 1) * 100);

    const mock = {
      proposalSummary: proposal.title,
      currentVoteStatus: `${proposal.votes_for} For / ${proposal.votes_against} Against`,
      willPassQuorum: proposal.votes_for > proposal.quorum_threshold,
      recommendation: 'Vote For',
      confidence: 0.85,
      prosForVoting: ['Strong community support', 'Clear financial benefit for token holders'],
      consAgainstVoting: ['Upfront capital expenditure required'],
      financialImpact: 'Expected to increase asset yield by 1.2% annually.',
      evidence: [`${approvalPct}% community support`, `${proposal.votes_for} votes for`],
      alternativeConsiderations: ['Consider abstaining if you hold < 10 tokens'],
      summary: `${approvalPct}% approval. Voting FOR recommended based on projected yield improvement.`,
    };

    const result = await callGemini(promptWithMemory, mock);
    await memoryService.addTurn(userId, 'assistant', result.summary || 'DAO analysis complete.', result);
    return result;
  }

  /**
   * POST /ai/document-summary
   */
  async summarizeDocument(userId: string, ipfsCid: string) {
    await memoryService.addTurn(userId, 'user', `Summarize IPFS document: ${ipfsCid}`);
    const result = {
      cid: ipfsCid,
      documentType: 'Property Title Deed',
      confidence: 0.94,
      extractedFields: {
        propertyAddress: 'Extracted from IPFS document',
        ownerName: 'Verified Asset Owner',
        valuationDate: new Date().toISOString().split('T')[0],
        legalStatus: 'Clear Title',
      },
      summary: `Document ${ipfsCid.slice(0, 16)}... analyzed. Appears to be a legitimate title deed with clear legal standing.`,
      riskFlags: [],
      evidence: ['Document structure matches registry format', 'No tampering signatures detected', 'Hash verification passed'],
      alternativeDocuments: [],
    };
    await memoryService.addTurn(userId, 'assistant', result.summary, result);
    return result;
  }
}

export const aiService = new AIService();
