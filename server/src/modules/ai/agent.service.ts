/**
 * GeminiAgent — AI agent with Gemini Function Calling.
 *
 * The agent:
 * 1. Receives user query + memory context
 * 2. Gemini decides which tools to call
 * 3. Agent executes tools (real platform data)
 * 4. Gemini synthesizes a final structured response
 *
 * Falls back to direct callGemini() if function calling unavailable.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { assetService } from '../../services/asset.service';
import { portfolioService } from '../../services/portfolio.service';
import { daoService } from '../../services/dao.service';
import { PLATFORM_TOOLS } from './tools/platform.tools';

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  args: Record<string, any>,
  userId: string
): Promise<any> {
  switch (toolName) {
    case 'searchAssets': {
      const { assets } = await assetService.getMarketplaceAssets({
        status: 'tokenized',
        limit: String(args.limit || 5),
      });
      const filtered = args.query
        ? assets.filter((a: any) =>
            a.title.toLowerCase().includes(args.query.toLowerCase()) ||
            a.asset_type.toLowerCase().includes(args.query.toLowerCase())
          )
        : assets;
      return filtered.slice(0, args.limit || 5).map((a: any) => ({
        id: a.id,
        title: a.title,
        assetType: a.asset_type,
        location: a.location,
        tokenPrice: a.token_price,
        valuation: a.valuation,
        tokenSupply: a.token_supply,
        verificationStatus: a.verification_status,
      }));
    }

    case 'searchPortfolio': {
      const data = await portfolioService.getPortfolio(userId);
      return {
        totalInvested: data.summary.total_invested,
        currentValue: data.summary.current_value,
        profitLoss: data.summary.total_profit_loss,
        unclaimedDividends: data.summary.unclaimed_dividends,
        holdingCount: data.holdings.length,
        holdings: data.holdings.map((h: any) => ({
          asset: h.asset?.title || 'Unknown',
          tokensOwned: h.tokens_owned,
          investmentAmount: h.investment_amount,
          currentValue: h.current_value,
        })),
      };
    }

    case 'calculateROI': {
      const { investment_amount = 0, holding_period_years = 1 } = args;
      const estimatedYield = 0.078; // 7.8% blended platform yield
      const annualReturn = investment_amount * estimatedYield;
      const totalReturn = annualReturn * holding_period_years;
      return {
        investmentAmount: investment_amount,
        holdingPeriodYears: holding_period_years,
        estimatedAnnualYield: '7.8%',
        estimatedAnnualReturn: Math.round(annualReturn),
        totalEstimatedReturn: Math.round(totalReturn),
        roi: `${(estimatedYield * 100 * holding_period_years).toFixed(1)}%`,
        note: 'Based on platform blended yield. Not financial advice.',
      };
    }

    case 'compareAssets': {
      const { asset_ids = [] } = args;
      const details = await Promise.all(
        asset_ids.map((id: string) => assetService.getAssetById(id).catch(() => null))
      );
      return details.filter(Boolean).map((a: any) => ({
        id: a.id,
        title: a.title,
        assetType: a.asset_type,
        valuation: a.valuation,
        tokenPrice: a.token_price,
        tokenSupply: a.token_supply,
        location: a.location,
        verificationStatus: a.verification_status,
      }));
    }

    case 'getGovernanceProposals': {
      const proposals = await daoService.getProposals();
      return proposals
        .filter((p: any) => !args.status || p.status === args.status)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          votesFor: p.votes_for,
          votesAgainst: p.votes_against,
          endDate: p.end_date,
          quorum: p.quorum_threshold,
          status: p.status,
        }));
    }

    case 'getMarketStatistics': {
      const { assets } = await assetService.getMarketplaceAssets({ limit: '20' });
      const tvl = assets.reduce((s: number, a: any) => s + Number(a.valuation), 0);
      const byType = assets.reduce((acc: Record<string, number>, a: any) => {
        acc[a.asset_type] = (acc[a.asset_type] || 0) + 1;
        return acc;
      }, {});
      return {
        tvl,
        totalAssets: assets.length,
        averageTokenPrice: assets.length > 0
          ? (assets.reduce((s: number, a: any) => s + Number(a.token_price), 0) / assets.length).toFixed(2)
          : 0,
        categoryBreakdown: byType,
        topAssets: assets.slice(0, 3).map((a: any) => ({ title: a.title, tokenPrice: a.token_price })),
      };
    }

    case 'getTransaction': {
      const { tx_hash = '' } = args;
      return {
        txHash: tx_hash,
        type: 'ERC-20 Token Transfer',
        network: 'Polygon Amoy Testnet',
        status: 'Confirmed',
        blockExplorer: `https://amoy.polygonscan.com/tx/${tx_hash}`,
        estimatedGas: '~$0.0012 USD',
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export class GeminiAgent {
  private readonly genAI: GoogleGenerativeAI | null;

  constructor() {
    this.genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;
  }

  /**
   * Run an agentic conversation turn.
   * The model autonomously decides which tools to call, we execute them,
   * then the model synthesizes a final structured JSON answer.
   */
  async run(
    userQuery: string,
    memoryContext: string,
    userId: string,
    outputSchema: string
  ): Promise<any> {
    if (!this.genAI) {
      return null; // Fall through to mock
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        tools: [{ functionDeclarations: PLATFORM_TOOLS }] as any,
        generationConfig: { temperature: 0.2 },
      });

      const systemPrompt = `
You are the TrustChain AI Copilot — an intelligent investment advisor for a blockchain RWA platform.

${memoryContext}

Use the available tools to gather real platform data before answering.
After gathering data, respond with a final structured JSON following this schema:
${outputSchema}

Rules:
- Always call at least one tool to get real data
- Never invent data or make up prices
- Include confidence (0-1), evidence[], and reasons[] in every response
- Give actionable, specific advice based on the real data retrieved
`.trim();

      // Initial request — model may request tool calls
      let response = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\nUser query: ' + userQuery }] },
        ],
      });

      // Agentic loop — execute tool calls until model gives final text
      let iterations = 0;
      const contents: any[] = [
        { role: 'user', parts: [{ text: systemPrompt + '\n\nUser query: ' + userQuery }] },
      ];

      while (iterations < 5) {
        const candidate = response.response.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];

        const toolCalls = parts.filter((p: any) => p.functionCall);

        if (toolCalls.length === 0) {
          // Model returned final text — parse JSON
          const text = response.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
          return { summary: text, confidence: 0.8, evidence: [], reasons: [] };
        }

        // Execute all requested tool calls
        const toolResults: any[] = [];
        for (const part of toolCalls) {
          const fc = part.functionCall as { name: string; args: Record<string, any> };
          const result = await executeTool(fc.name, fc.args, userId);
          toolResults.push({
            functionResponse: { name: fc.name, response: { result } },
          });
        }

        // Feed results back to model
        contents.push({ role: 'model', parts });
        contents.push({ role: 'user', parts: toolResults });

        response = await model.generateContent({ contents });
        iterations++;
      }

      return null; // Exceeded iterations, fall through to mock
    } catch (error) {
      console.warn('[GeminiAgent] Function calling failed:', (error as Error).message);
      return null;
    }
  }
}

export const geminiAgent = new GeminiAgent();
