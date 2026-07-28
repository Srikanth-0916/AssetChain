import { describe, it, expect } from 'vitest';
import { aiService } from '../src/modules/ai/ai.service';
import { fraudService } from '../src/modules/verification/fraud.service';
import { env } from '../src/config/env';

describe('AssetChain AI Copilot System Tests', () => {
  it('Should load GEMINI_API_KEY from environment', () => {
    expect(env.GEMINI_API_KEY).toBeDefined();
    expect(env.GEMINI_API_KEY?.length).toBeGreaterThan(10);
    console.log('✓ GEMINI_API_KEY is configured in server/.env');
  });

  it('Should generate investment advice (API with Mock Fallback)', async () => {
    const res = await aiService.getInvestmentAdvice('user-123', 50000, 'medium');
    expect(res).toBeDefined();
    expect(res.summary).toBeTypeOf('string');
    expect(res.recommendations).toBeInstanceOf(Array);
    console.log('✓ Investment advice output:', res.summary);
  }, 15000);

  it('Should analyze portfolio diversification & risk', async () => {
    const res = await aiService.analyzePortfolio('user-123');
    expect(res).toBeDefined();
    expect(res.summary).toBeTypeOf('string');
    console.log('✓ Portfolio analysis output:', res.summary);
  }, 15000);

  it('Should run AI fraud detection analysis on an asset', async () => {
    const report = await fraudService.analyzeAsset({
      title: 'Solar Farm Alpha',
      description: 'Institutional renewable energy asset generating consistent 8.5% yield on Polygon.',
      assetType: 'renewable_energy',
      location: 'Nevada, USA',
      valuation: 5000000,
      tokenSupply: 50000,
      documentFields: { owner: 'SolarCorp LLC', status: 'Verified' },
    });

    expect(report).toBeDefined();
    expect(report.fraudScore).toBeGreaterThanOrEqual(0);
    expect(report.riskLevel).toBeDefined();
    console.log(`✓ Fraud analysis completed: Risk Level = ${report.riskLevel}, Score = ${report.fraudScore}`);
  }, 15000);

  it('Should retrieve market insights via AI copilot', async () => {
    const res = await aiService.getMarketInsights('user-123');
    expect(res).toBeDefined();
    expect(res.summary).toBeTypeOf('string');
    console.log('✓ Market insights output:', res.summary);
  }, 15000);
});
