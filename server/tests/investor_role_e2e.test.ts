import { describe, test, expect, beforeAll } from 'vitest';
import { authService } from '../src/services/auth.service';
import { portfolioService } from '../src/services/portfolio.service';
import { portfolioIntelligenceService } from '../src/modules/analytics/portfolio.intelligence.service';
import { nomineeService } from '../src/modules/nominee/nominee.service';
import { investmentService } from '../src/modules/investment/investment.service';
import { razorpayService } from '../src/modules/payment/razorpay.service';
import { aiService } from '../src/modules/ai/ai.service';
import { assetComparisonService } from '../src/modules/analytics/asset.comparison.service';
import { supabaseAdmin } from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

describe('Investor Role Complete Panel & Financials E2E Test Suite', () => {
  let investorUserId: string;
  let investorEmail: string;
  let authToken: string;

  beforeAll(async () => {
    investorEmail = `investor_e2e_${Date.now()}@assetchain.io`;
    const regResult = await authService.register({
      full_name: 'E2E Investor Alex',
      email: investorEmail,
      password: 'InvestorPassword123!',
      role: 'investor',
    });
    investorUserId = regResult.user.id;
    authToken = regResult.token;
  });

  test('1. Investor Identity & KYC Document Verification Panel', async () => {
    // Check initial compliance profile
    const { data: profile } = await supabaseAdmin
      .from('compliance_profiles')
      .select('*')
      .eq('user_id', investorUserId)
      .maybeSingle();

    expect(profile).toBeDefined();

    // Simulate Investor submitting KYC Identity Document
    const documentCid = `ipfs://QmTestInvestorKyc_${Date.now()}`;
    const { error: kycErr } = await supabaseAdmin
      .from('profiles')
      .update({
        kyc_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', investorUserId);

    expect(kycErr).toBeNull();

    // Verify KYC status is updated to pending
    const { data: updatedUser } = await supabaseAdmin
      .from('profiles')
      .select('kyc_status')
      .eq('id', investorUserId)
      .single();

    expect(updatedUser?.kyc_status).toBe('pending');
  });

  test('2. Investor Portfolio & Financial Intelligence Panel', async () => {
    // Query investor portfolio
    const portfolio = await portfolioService.getPortfolio(investorUserId);
    expect(portfolio).toBeDefined();
    expect(portfolio.summary.total_invested).toBeGreaterThanOrEqual(0);
    expect(portfolio.summary.total_assets).toBeGreaterThanOrEqual(0);

    // Query advanced portfolio intelligence report
    const intelligence = await portfolioIntelligenceService.getPortfolioIntelligence(investorUserId);
    expect(intelligence).toBeDefined();
    expect(intelligence.totalInvestedINR).toBeGreaterThanOrEqual(0);
    expect(intelligence.diversificationScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(intelligence.sectorAllocations)).toBe(true);
  });

  test('3. Investor Money Details — Razorpay Fiat INR Order & Token Purchase', async () => {
    // 3a. Create Razorpay Payment Order for $120 investment (10 tokens @ $12)
    const order = await razorpayService.createOrder(120, 'asset-demo-uuid-001', 10);

    expect(order).toBeDefined();
    expect(order.orderId).toContain('order_');
    expect(order.amount).toBeGreaterThan(0);

    // 3b. Verify Razorpay Payment Signature and Simulate Token Mint
    const verifyResult = await razorpayService.verifyAndMint(
      order.orderId,
      `pay_${Date.now()}`,
      'valid_mock_signature',
      'asset-demo-uuid-001',
      10
    );

    expect(verifyResult.verified).toBe(true);
    expect(verifyResult.txSimulation).toBeDefined();
    expect(verifyResult.txSimulation.tokensMinted).toBe(10);
    expect(verifyResult.txSimulation.txHash).toContain('0x');
  });

  test('4. Investor Nominee & Heir Estate Details Panel', async () => {
    // Assign Nominee & Beneficiary
    const nominee = await nomineeService.setNominee(investorUserId, {
      fullName: 'Samantha Alex (Daughter)',
      relationship: 'Daughter / Primary Heir',
      email: 'samantha.alex@example.com',
      nomineeWalletAddress: '0x8888888888888888888888888888888888888888',
      allocationPercentage: 100,
    });

    expect(nominee).toBeDefined();
    expect(nominee.fullName).toBe('Samantha Alex (Daughter)');
    expect(nominee.nomineeWalletAddress).toBe('0x8888888888888888888888888888888888888888');

    // Retrieve Nominee Details
    const retrievedNominee = await nomineeService.getNominee(investorUserId);
    expect(retrievedNominee).toBeDefined();
    expect(retrievedNominee?.fullName).toBe('Samantha Alex (Daughter)');
  });

  test('5. Investor AI Financial Advice & Risk Comparison Panel', async () => {
    // Generate AI Investment Advice
    const advice = await aiService.getInvestmentAdvice(
      investorUserId,
      100000,
      'medium'
    );

    expect(advice).toBeDefined();
    expect(advice.summary.length).toBeGreaterThan(10);
    expect(Array.isArray(advice.recommendations)).toBe(true);

    // Compare Assets for Investor Side-by-Side Analysis
    const comparison = await assetComparisonService.compareAssets([
      'ast-com-01',
      'ast-sol-02',
    ]);

    expect(comparison).toBeDefined();
    expect(Array.isArray(comparison.metrics)).toBe(true);
    expect(comparison.metrics.length).toBeGreaterThan(0);
  });
});
