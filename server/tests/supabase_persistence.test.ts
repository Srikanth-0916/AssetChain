import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../src/config/database';
import { userService } from '../src/services/user.service';
import { assetService } from '../src/services/asset.service';
import { approvalService } from '../src/modules/approval/approval.service';
import { notificationService } from '../src/modules/notifications/notification.service';
import { auditService } from '../src/modules/audit/audit.service';
import { portfolioService } from '../src/services/portfolio.service';

describe('Supabase Multi-Role End-to-End Data Persistence Verification Test Suite', () => {
  const newUserId = uuidv4();
  const investorId = uuidv4();
  const ownerId = uuidv4();
  const verifierId = uuidv4();
  const adminId = uuidv4();

  it('1. New User Registration & Profile Data Persistence', async () => {
    const profile = await userService.updateProfile(newUserId, {
      full_name: 'New Test User',
      email: 'newuser@assetchain.com',
      profile_image_url: 'https://supabase.co/storage/v1/object/public/avatars/' + newUserId + '/avatar.png',
    });

    expect(profile).toBeDefined();
    expect(profile.id).toBe(newUserId);
    expect(profile.full_name).toBe('New Test User');
    expect(profile.profile_image_url).toContain('avatar.png');
  });

  it('2. KYC Document Upload & Status Persistence for Investor', async () => {
    const kycResult = await userService.submitKYC(
      investorId,
      'QmKycDocCid991122334455667788',
      {
        file_name: 'aadhaar_pan_combined.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 2048576,
        document_type: 'national_id',
      }
    );

    expect(kycResult).toBeDefined();
    expect(kycResult.id).toBe(investorId);
    expect(kycResult.kyc_status).toBe('pending');
    expect(kycResult.kyc_document_cid).toBe('QmKycDocCid991122334455667788');

    // Admin reviews and approves KYC
    const reviewResult = await userService.reviewKYC(investorId, { status: 'approved' }, adminId);
    expect(reviewResult.kyc_status).toBe('approved');
  });

  it('3. Asset Owner Property Registration & Title Deed Persistence', async () => {
    // Use a real profile ID from Supabase (FK constraint requires a valid profile)
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id').eq('role', 'asset_owner').limit(1);
    const realOwnerId = profiles && profiles[0] ? profiles[0].id : ownerId;

    const asset = await assetService.createAsset(realOwnerId, {
      title: 'Manhattan Commercial Center ' + Date.now(),
      description: 'Class-A Commercial Property in New York City with 100% occupancy.',
      asset_type: 'commercial_property',
      location: 'New York, USA',
      valuation: 5000000,
      token_supply: 50000,
      documents: [
        {
          document_type: 'title_deed',
          file_name: 'manhattan_deed.pdf',
          ipfs_cid: 'QmDeedCid112233445566',
          mime_type: 'application/pdf',
          file_size_bytes: 5242880,
        },
      ],
    });

    expect(asset).toBeDefined();
    expect(asset.owner_id).toBe(realOwnerId);
    expect(asset.valuation).toBe(5000000);
    expect(asset.token_supply).toBe(50000);
    // token_price is a GENERATED column in Supabase; it will be auto-computed or undefined in insert response
    expect(asset.verification_status).toBe('pending');
  });

  it('4. Verifier & Admin Multi-Sig Workflow & Voting Persistence', async () => {
    // Use a real profile ID from Supabase (FK constraint requires a valid profile)
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id').eq('role', 'asset_owner').limit(1);
    const realOwnerId = profiles && profiles[0] ? profiles[0].id : ownerId;

    const createdAsset = await assetService.createAsset(realOwnerId, {
      title: 'Solar Array Energy Park ' + Date.now(),
      description: 'Renewable energy grid asset.',
      asset_type: 'renewable_energy',
      location: 'Spain',
      valuation: 2000000,
      token_supply: 20000,
    });

    const req = await approvalService.createRequest(createdAsset.id, createdAsset.title);

    expect(req).toBeDefined();
    expect(req.status).toBe('pending');

    // Verifier votes approve
    const votedReq = await approvalService.submitVote(
      req.id,
      'verifier',
      verifierId,
      'approved',
      'Verified physical deed and title registry.'
    );

    expect(votedReq.approvedCount).toBeGreaterThanOrEqual(1);

    // Admin tokenizes asset
    const randomContractAddress = '0x' + (uuidv4() + uuidv4()).replace(/-/g, '').slice(0, 40);
    const tokenizedAsset = await assetService.tokenizeAsset(
      createdAsset.id,
      randomContractAddress,
      adminId
    );

    expect(tokenizedAsset.verification_status).toBe('tokenized');
    expect(tokenizedAsset.contract_address).toBe(randomContractAddress);
  });

  it('5. Investor Portfolio Returns Empty State for New User (Production Behavior)', async () => {
    // In production: a new investor with no investments has an empty portfolio
    const portfolio = await portfolioService.getPortfolio(investorId);
    expect(portfolio.summary).toBeDefined();
    expect(portfolio.holdings).toBeDefined();
    expect(Array.isArray(portfolio.holdings)).toBe(true);
    // New user has no investments yet — portfolio should be empty/zero
    expect(portfolio.summary.total_invested).toBe(0);
    expect(portfolio.holdings.length).toBe(0);
    console.log('✓ Empty portfolio correctly returned for new investor (production behavior)');
  });


  it('6. Notifications & Audit Logs Structured Persistence', async () => {
    // Dispatch test notification
    const notif = await notificationService.notify(
      investorId,
      'purchase_confirmed',
      'Investment Confirmed',
      'You successfully purchased 50 tokens in Manhattan Commercial Plaza.',
      { tokensCount: 50, totalAmount: 12500 }
    );


    expect(notif).toBeDefined();
    expect(notif.userId).toBe(investorId);

    // Fetch user notifications
    const userNotifs = notificationService.getNotifications(investorId);
    expect(userNotifs.length).toBeGreaterThan(0);

    // Check audit log persistence
    const auditLogs = auditService.getLog(50);
    expect(auditLogs.length).toBeGreaterThan(0);
    const hasKycAudit = auditLogs.some((l) => l.type === 'kyc_submitted' || l.type === 'kyc_approved');
    expect(hasKycAudit).toBe(true);
  });
});
