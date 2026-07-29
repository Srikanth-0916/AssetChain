/**
 * Prompt Builder — constructs structured, memory-aware prompts for the AI Copilot.
 *
 * Module 9: Every output schema mandates:
 *   - confidence (0.0 – 1.0)
 *   - evidence[]  (factual bullets from platform data)
 *   - alternativeAssets or alternativeConsiderations[]
 *   - reasons[]   (explains the score/recommendation)
 */

// ─── Context Types ────────────────────────────────────────────────────────────

export interface InvestmentAdviceContext {
  userBudget: number;
  riskPreference: 'low' | 'medium' | 'high';
  existingPortfolio: Array<{ assetType: string; percentage: number }>;
  availableAssets: Array<{
    name: string; roi: number; risk: string; rentalYield: number;
    occupancy?: number; price: number; location: string; assetType: string;
  }>;
}

export interface PortfolioAnalysisContext {
  holdings: Array<{
    title: string; tokensOwned: number; investmentAmount: number;
    currentValue: number; profitLoss: number; assetType: string;
  }>;
  totalInvested: number;
  currentValue: number;
  diversificationScore: number;
}

export interface RiskAnalysisContext {
  assetTitle: string; assetType: string; location: string;
  valuation: number; tokenPrice: number; verificationStatus: string; createdAt: string;
}

export interface MarketInsightsContext {
  assets: Array<{ title: string; assetType: string; valuation: number; tokenPrice: number; location: string }>;
  platformStats: { totalAssets: number; totalValue: number; activeProposals: number };
}

export interface DAOAssistantContext {
  proposalTitle: string; proposalDescription: string; votesFor: number;
  votesAgainst: number; endDate: string; quorumThreshold: number; assetTitle?: string;
}

// ─── Shared Explainability Schema Note ───────────────────────────────────────

const EXPLAINABILITY_REQUIREMENT = `
CRITICAL EXPLAINABILITY REQUIREMENT:
Every response MUST include:
- "confidence": float 0.0–1.0 (how certain is this analysis)
- "reasons": array of strings (why this score/recommendation was given)
- "evidence": array of strings (factual bullets from the data you were given)
- "alternativeAssets" or "alternativeConsiderations": array of strings
Do NOT return a score or recommendation without explaining it. Users are making real financial decisions.
`.trim();

// ─── Prompt Builders ──────────────────────────────────────────────────────────

export function buildInvestmentAdvicePrompt(ctx: InvestmentAdviceContext): string {
  const budget = ctx?.userBudget ?? 0;
  const risk = (ctx?.riskPreference || 'medium').toUpperCase();
  const portfolio = ctx?.existingPortfolio ?? [];
  const assets = ctx?.availableAssets ?? [];

  return `
SYSTEM:
You are the TrustChain AI Copilot — an expert investment advisor for a blockchain RWA tokenization platform.
Use ONLY the structured data below. Never invent data. Never recommend assets above budget.
${EXPLAINABILITY_REQUIREMENT}

USER CONTEXT:
- Available Budget: $${budget.toLocaleString()} USD
- Risk Preference: ${risk}
- Existing Portfolio: ${JSON.stringify(portfolio)}

AVAILABLE ASSETS:
${JSON.stringify(assets, null, 2)}

OUTPUT FORMAT (strict JSON):
{
  "summary": "2-3 sentence executive summary",
  "confidence": 0.0,
  "recommendations": [
    {
      "assetName": "",
      "tokensToConsider": 0,
      "estimatedCost": 0,
      "expectedROI": "",
      "rentalYield": "",
      "riskLevel": "",
      "reason": "",
      "evidence": [],
      "alternativeAssets": []
    }
  ],
  "riskAnalysis": "",
  "reasons": [],
  "estimatedAnnualReturn": "",
  "diversificationAdvice": "",
  "warnings": [],
  "disclaimer": ""
}
`.trim();
}

export function buildPortfolioAnalysisPrompt(ctx: PortfolioAnalysisContext): string {
  const totalInvested = ctx?.totalInvested ?? 0;
  const currentValue = ctx?.currentValue ?? 0;
  const profitLoss = currentValue - totalInvested;
  const diversificationScore = ctx?.diversificationScore ?? 0;
  const holdings = ctx?.holdings ?? [];

  return `
SYSTEM:
You are the TrustChain AI Copilot — a portfolio intelligence engine for blockchain RWA investments.
${EXPLAINABILITY_REQUIREMENT}

PORTFOLIO DATA:
- Total Invested: $${totalInvested.toLocaleString()}
- Current Value: $${currentValue.toLocaleString()}
- P&L: $${profitLoss.toLocaleString()}
- Diversification Score: ${diversificationScore}/100

Holdings:
${JSON.stringify(holdings, null, 2)}

OUTPUT FORMAT (strict JSON):
{
  "summary": "",
  "confidence": 0.0,
  "reasons": [],
  "diversificationAnalysis": "",
  "riskRating": "Low | Medium | High",
  "projectedAnnualIncome": "",
  "suggestions": [
    { "action": "", "reason": "", "priority": "High | Medium | Low", "evidence": [] }
  ],
  "rebalancingAdvice": "",
  "alternativeStrategies": [],
  "evidence": [],
  "warnings": []
}
`.trim();
}

export function buildRiskAnalysisPrompt(ctx: RiskAnalysisContext): string {
  return `
SYSTEM:
You are the TrustChain AI Copilot — a risk assessment engine for tokenized real-world assets.
${EXPLAINABILITY_REQUIREMENT}

ASSET DATA:
${JSON.stringify(ctx, null, 2)}

OUTPUT FORMAT (strict JSON):
{
  "overallRiskScore": 0,
  "riskLevel": "Low | Medium | High | Very High",
  "confidence": 0.0,
  "reasons": [],
  "riskFactors": [
    { "factor": "", "severity": "Low | Medium | High", "explanation": "", "evidence": [] }
  ],
  "positiveSignals": [],
  "recommendation": "Buy | Hold | Caution | Avoid",
  "dueDiligenceChecklist": [],
  "alternativeAssets": [],
  "evidence": [],
  "summary": ""
}
`.trim();
}

export function buildMarketInsightsPrompt(ctx: MarketInsightsContext): string {
  return `
SYSTEM:
You are the TrustChain AI Copilot — a market intelligence analyst for tokenized real-world assets.
${EXPLAINABILITY_REQUIREMENT}

PLATFORM DATA:
Stats: ${JSON.stringify(ctx.platformStats)}
Assets: ${JSON.stringify(ctx.assets, null, 2)}

OUTPUT FORMAT (strict JSON):
{
  "marketSentiment": "Bullish | Neutral | Bearish",
  "confidence": 0.0,
  "reasons": [],
  "topPerformingCategories": [],
  "trendingAssets": [],
  "marketOpportunities": [],
  "riskWarnings": [],
  "evidence": [],
  "summary": ""
}
`.trim();
}

export function buildDAOAssistantPrompt(ctx: DAOAssistantContext): string {
  return `
SYSTEM:
You are the TrustChain AI Copilot — a DAO governance advisor for token holders.
${EXPLAINABILITY_REQUIREMENT}

PROPOSAL DATA:
${JSON.stringify(ctx, null, 2)}

OUTPUT FORMAT (strict JSON):
{
  "proposalSummary": "",
  "currentVoteStatus": "",
  "willPassQuorum": true,
  "recommendation": "Vote For | Vote Against | Abstain",
  "confidence": 0.0,
  "reasons": [],
  "prosForVoting": [],
  "consAgainstVoting": [],
  "financialImpact": "",
  "evidence": [],
  "alternativeConsiderations": [],
  "summary": ""
}
`.trim();
}

export function buildPropertyComparisonPrompt(assets: Array<Record<string, any>>): string {
  return `
SYSTEM:
You are the TrustChain AI Copilot — a property comparison engine for tokenized RWA investments.
${EXPLAINABILITY_REQUIREMENT}

ASSETS TO COMPARE:
${JSON.stringify(assets, null, 2)}

OUTPUT FORMAT (strict JSON):
{
  "comparisonTable": [
    { "metric": "", "values": {} }
  ],
  "winner": "",
  "winnerReason": "",
  "confidence": 0.0,
  "reasons": [],
  "rankings": [
    { "assetName": "", "score": 0, "strengths": [], "weaknesses": [], "evidence": [] }
  ],
  "evidence": [],
  "summary": ""
}
`.trim();
}
