import { describe, it, expect } from 'vitest';
import { spvService } from '../src/modules/spv/spv.service';
import { approvalService } from '../src/modules/approval/approval.service';
import { complianceService } from '../src/modules/compliance/compliance.service';
import { nomineeService } from '../src/modules/nominee/nominee.service';

describe('AssetChain Modules 13-17 Test Suite', () => {
  // Module 13: SPV Legal Ownership
  describe('Module 13: SPV / Legal Ownership', () => {
    it('Should fetch SPV legal ownership for an asset', async () => {
      const spv = await spvService.getByAssetId('asset-demo-uuid-001');
      expect(spv).toBeDefined();
      expect(spv.companyName).toContain('Manhattan');
      expect(spv.registrationNumber).toBeDefined();
      expect(spv.trustee).toBeDefined();
      console.log('✓ SPV Legal Entity:', spv.companyName, '| Reg:', spv.registrationNumber);
    });

    it('Should upsert SPV legal entity details', async () => {
      const updated = await spvService.upsertSPV('asset-demo-uuid-001', {
        companyName: 'Manhattan Commercial Holding SPV LLC',
      });
      expect(updated.companyName).toBe('Manhattan Commercial Holding SPV LLC');
    });
  });

  // Module 14: Multi-Signature Approval Workflow (Blockchain-First Event Indexing)
  describe('Module 14: Multi-Signature Approval (2-of-3 Blockchain-First)', () => {
    it('Should initialize a 2-of-3 multi-sig approval request', async () => {
      const req = await approvalService.createRequest('asset-test-99', 'Solar Array Test Asset');
      expect(req).toBeDefined();
      expect(req.status).toBe('pending');
      expect(req.requiredVotes).toBe(2);
    });

    it('Should approve request via indexed smart contract events (Blockchain-First)', async () => {
      const req = await approvalService.createRequest('asset-test-99', 'Solar Array Test Asset');
      
      // Smart Contract Event 1: Verifier ApprovalVoted indexed
      const step1 = await approvalService.processOnChainApprovalEvent({
        txHash: '0x' + '1'.repeat(64),
        assetId: 'asset-test-99',
        voterAddress: '0xVerifierAddress001',
        role: 'verifier',
        decision: 'approved',
        comments: 'Verified on-chain document proof',
      });
      expect(step1.approvedCount).toBe(1);
      expect(step1.status).toBe('pending');
      expect(step1.gnosisSafeTxHash).toBe('0x' + '1'.repeat(64));

      // Smart Contract Event 2: Legal Reviewer ApprovalVoted indexed -> 2/3 threshold met
      const step2 = await approvalService.processOnChainApprovalEvent({
        txHash: '0x' + '2'.repeat(64),
        assetId: 'asset-test-99',
        voterAddress: '0xLegalAddress002',
        role: 'legal_reviewer',
        decision: 'approved',
        comments: 'On-chain legal title verified',
      });
      expect(step2.approvedCount).toBe(2);
      expect(step2.status).toBe('approved');
      expect(step2.gnosisSafeTxHash).toBe('0x' + '2'.repeat(64));
      console.log('✓ Blockchain-First Multi-Sig indexed approval successful: Status APPROVED via on-chain events');
    });

    it('Should maintain backward compatibility for submitVote method', async () => {
      const req = await approvalService.createRequest('asset-compat-100', 'Compatibility Test Asset');
      const step1 = await approvalService.submitVote(req.id, 'verifier', 'user-v1', 'approved');
      expect(step1.approvedCount).toBe(1);
      expect(step1.gnosisSafeTxHash).toContain('0xvote_');
    });
  });

  // Module 16: Simplified Compliance Layer
  describe('Module 16: Compliance Layer & ERC-3643 Compatibility', () => {
    it('Should retrieve user compliance profile', async () => {
      const profile = await complianceService.getProfile('investor-demo-uuid-001');
      expect(profile).toBeDefined();
      expect(profile.kycStatus).toBe('approved');
      expect(profile.jurisdictionCode).toBe(840);
      expect(profile.transferPermission).toBe(true);
      expect(profile.erc3643Compatible).toBe(true);
      console.log(`✓ Compliance Profile: KYC=${profile.kycStatus}, Jurisdiction=${profile.jurisdictionCode}, RiskTier=${profile.riskTier}`);
    });

    it('Should update compliance profile and whitelist status', async () => {
      const updated = await complianceService.updateComplianceProfile('user-test-01', {
        kycStatus: 'approved',
        jurisdiction: 'United States',
        jurisdictionCode: 840,
        riskTier: 'low',
        transferPermission: true,
      });
      expect(updated.kycStatusCode).toBe(1);
      expect(updated.isWhitelisted).toBe(true);
    });
  });

  // Module 17: Nominee & Inheritance
  describe('Module 17: Nominee & Inheritance Verification Workflow', () => {
    it('Should assign and retrieve investor nominee', async () => {
      const nominee = await nomineeService.setNominee('investor-test-100', {
        fullName: 'Alice Johnson',
        relationship: 'Daughter',
        email: 'alice@example.com',
        nomineeWalletAddress: '0x1111222233334444555566667777888899990000',
      });
      expect(nominee).toBeDefined();
      expect(nominee.fullName).toBe('Alice Johnson');

      const fetched = await nomineeService.getNominee('investor-test-100');
      expect(fetched?.fullName).toBe('Alice Johnson');
      console.log(`✓ Nominee assigned: ${fetched?.fullName} (${fetched?.relationship})`);
    });

    it('Should handle inheritance claim verification & execution', async () => {
      const claim = await nomineeService.submitInheritanceClaim({
        investorUserId: 'investor-test-100',
        investorWalletAddress: '0x0000000000000000000000000000000000000001',
        nomineeId: 'nominee-100',
        nomineeWalletAddress: '0x1111222233334444555566667777888899990000',
        deathCertificateCID: 'QmDeathCertDoc123',
        legalProbateDocCID: 'QmProbateDoc456',
      });

      expect(claim.status).toBe('pending_verification');

      // Admin legal verification
      const verified = await nomineeService.verifyClaim(claim.id, true, 'Probate document verified');
      expect(verified.status).toBe('verified');

      // Admin execute transfer
      const executed = await nomineeService.executeInheritanceTransfer(claim.id);
      expect(executed.status).toBe('executed');
      expect(executed.executedTxHash).toBeDefined();
      console.log(`✓ Inheritance Token Transfer Executed: TxHash=${executed.executedTxHash}`);
    });
  });
});
