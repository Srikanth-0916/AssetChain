import { describe, it, expect } from 'vitest';
import { identityService } from '../src/modules/compliance/identity.service';
import { landRegistryService } from '../src/modules/verification/land.registry.service';
import { trustScoreService } from '../src/modules/trust/trust.service';
import { portfolioIntelligenceService } from '../src/modules/analytics/portfolio.intelligence.service';
import { fraudMonitorService } from '../src/modules/trust/fraud.monitor.service';
import { regulatoryReportService } from '../src/modules/compliance/regulatory.report.service';

describe('Enterprise Hardening & Infrastructure Services', () => {
  it('TC-ENT-1: Identity Verification — Aadhaar & PAN validation passes with Liveness & Sanctions check', async () => {
    const res = await identityService.verifyIdentity({
      userId: 'usr-investor-88',
      fullName: 'Rahul Sharma',
      dob: '1992-05-14',
      documentType: 'pan',
      documentNumber: 'ABCDE1234F',
      selfieBase64: 'data:image/jpeg;base64,sample...',
    });

    expect(res.overallStatus).toBe('APPROVED');
    expect(res.livenessScore).toBeGreaterThanOrEqual(80);
    expect(res.faceMatchScore).toBeGreaterThanOrEqual(85);
    expect(res.panValid).toBe(true);
    expect(res.sanctionsPassed).toBe(true);
    expect(res.checks.length).toBeGreaterThanOrEqual(5);
  });

  it('TC-ENT-2: Land Registry Engine — Verifies Encumbrance Certificate & Title Mutation', async () => {
    const report = await landRegistryService.verifyProperty({
      assetId: 'ast-com-01',
      surveyNumber: 'SUR-9921-A',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      subRegistrarOffice: 'SRO-Bandra',
      claimedOwnerName: 'TrustChain SPV Ltd',
    });

    expect(report.titleOwnerMatch).toBe(true);
    expect(report.encumbranceStatus).toBe('CLEAR');
    expect(report.legalRiskScore).toBe(0);
    expect(report.verdict).toBe('TITLE_CLEAR');
    expect(report.checks.length).toBe(5);
  });

  it('TC-ENT-3: Explainable Trust Score Engine — Computes additions, deductions, and institutional rating', async () => {
    const report = await trustScoreService.calculateTrustScore('ast-com-01');

    expect(report.trustScore).toBeGreaterThanOrEqual(0);
    expect(report.trustScore).toBeLessThanOrEqual(100);
    expect(report.institutionalRating).toBeDefined();
    expect(Array.isArray(report.explainableFactors)).toBe(true);
    expect(report.explainableFactors.length).toBeGreaterThan(0);

    const hasAddition = report.explainableFactors.some((f) => f.type === 'ADDITION');
    expect(hasAddition).toBe(true);
  });

  it('TC-ENT-4: Portfolio Intelligence Engine — Calculates Net Worth, CAGR, Yield & Sector Allocations', async () => {
    const report = await portfolioIntelligenceService.getPortfolioIntelligence('usr-investor-88');

    expect(report.totalNetWorthINR).toBeGreaterThan(0);
    expect(report.totalInvestedINR).toBeGreaterThan(0);
    expect(report.weightedYieldPercentage).toBeGreaterThan(0);
    expect(report.expectedPortfolioCAGR).toBeGreaterThan(0);
    expect(report.sectorAllocations.length).toBeGreaterThan(0);
    expect(report.geographicAllocations.length).toBeGreaterThan(0);
    expect(report.estimatedTaxLiabilityINR).toBeGreaterThanOrEqual(0);
  });

  it('TC-ENT-5: Continuous Fraud Sweep — Scans tokenized assets and flags risk anomalies', async () => {
    const sweep = await fraudMonitorService.runFraudSweep();

    expect(sweep.sweepId).toContain('SWEEP-');
    expect(sweep.totalAssetsScanned).toBeGreaterThan(0);
    expect(sweep.cleanAssetsCount + sweep.flaggedAssetsCount).toBe(sweep.totalAssetsScanned);
  });

  it('TC-ENT-6: Automated Regulatory Reporting — Generates SEBI/RBI compliance report format', async () => {
    const report = await regulatoryReportService.generateReport({
      authority: 'SEBI',
      periodStart: '2026-01-01',
      periodEnd: '2026-07-31',
    });

    expect(report.authority).toBe('SEBI');
    expect(report.complianceStatus).toBe('100% COMPLIANT');
    expect(report.summary.totalAssetsValueINR).toBeGreaterThan(0);
    expect(report.digitallySignedBy).toContain('TrustChain Automated Compliance Gateway');
  });
});
