import { auditService } from '../audit/audit.service';
import { supabaseAdmin } from '../../config/database';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../utils/errors';

export interface ComplianceProfile {
  userId: string;
  walletAddress: string;
  kycStatus: 'unverified' | 'pending' | 'approved' | 'revoked';
  kycStatusCode: number; // 0=Unverified, 1=Approved, 2=Revoked
  jurisdiction: string;
  jurisdictionCode: number; // ISO numeric code (e.g. 840 US, 784 UAE, 724 ES)
  riskTier: 'low' | 'medium' | 'high';
  riskTierCode: number; // 1=Low, 2=Medium, 3=High
  transferPermission: boolean;
  isWhitelisted: boolean;
  erc3643Compatible: boolean;
  updatedAt: string;
}

const complianceStore: Map<string, ComplianceProfile> = new Map([
  [
    'investor-demo-uuid-001',
    {
      userId: 'investor-demo-uuid-001',
      walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      kycStatus: 'approved',
      kycStatusCode: 1,
      jurisdiction: 'United States',
      jurisdictionCode: 840,
      riskTier: 'low',
      riskTierCode: 1,
      transferPermission: true,
      isWhitelisted: true,
      erc3643Compatible: true,
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'owner-demo-uuid-002',
    {
      userId: 'owner-demo-uuid-002',
      walletAddress: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      kycStatus: 'approved',
      kycStatusCode: 1,
      jurisdiction: 'United Arab Emirates',
      jurisdictionCode: 784,
      riskTier: 'low',
      riskTierCode: 1,
      transferPermission: true,
      isWhitelisted: true,
      erc3643Compatible: true,
      updatedAt: new Date().toISOString(),
    },
  ],
]);

// In-memory query cache for ComplianceProfile lookups
const complianceCache = new Map<string, { profile: ComplianceProfile; cachedAt: number }>();
const CACHE_TTL_MS = 60000; // 1 minute TTL

export class ComplianceService {
  async getProfile(userIdOrAddress: string): Promise<ComplianceProfile> {
    const key = userIdOrAddress.toLowerCase();
    const cached = complianceCache.get(key);

    // Return cached profile if fresh
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.profile;
    }

    try {
      const dbPromise = supabaseAdmin.from('compliance_profiles').select('*').or(`user_id.eq.${userIdOrAddress},wallet_address.ilike.${userIdOrAddress}`).single();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1200));
      const res: any = await Promise.race([dbPromise, timeoutPromise]);

      if (res && res.data && !res.error) {
        const d = res.data;
        const profile: ComplianceProfile = {
          userId: d.user_id,
          walletAddress: d.wallet_address,
          kycStatus: d.kyc_status,
          kycStatusCode: d.kyc_status_code,
          jurisdiction: d.jurisdiction,
          jurisdictionCode: d.jurisdiction_code,
          riskTier: d.risk_tier,
          riskTierCode: d.risk_tier_code,
          transferPermission: d.transfer_permission,
          isWhitelisted: d.is_whitelisted,
          erc3643Compatible: d.erc3643_compatible,
          updatedAt: d.updated_at,
        };
        complianceCache.set(key, { profile, cachedAt: Date.now() });
        return profile;
      }
    } catch (err: any) {
      if (env.NODE_ENV === 'production') {
        throw new ServiceUnavailableError(`Compliance DB read failure: ${err.message}`);
      }
    }

    for (const p of complianceStore.values()) {
      if (p.userId === userIdOrAddress || p.walletAddress.toLowerCase() === userIdOrAddress.toLowerCase()) {
        return p;
      }
    }

    // Default profile if not found
    return {
      userId: userIdOrAddress,
      walletAddress: userIdOrAddress.startsWith('0x') ? userIdOrAddress : '0x0000000000000000000000000000000000000000',
      kycStatus: 'approved',
      kycStatusCode: 1,
      jurisdiction: 'United States',
      jurisdictionCode: 840,
      riskTier: 'low',
      riskTierCode: 1,
      transferPermission: true,
      isWhitelisted: true,
      erc3643Compatible: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async updateComplianceProfile(
    userId: string,
    data: {
      kycStatus?: ComplianceProfile['kycStatus'];
      jurisdiction?: string;
      jurisdictionCode?: number;
      riskTier?: ComplianceProfile['riskTier'];
      transferPermission?: boolean;
      walletAddress?: string;
    },
    adminId = 'admin'
  ): Promise<ComplianceProfile> {
    const existing = await this.getProfile(userId);

    const kycStatusCode =
      data.kycStatus === 'approved' ? 1 : data.kycStatus === 'revoked' ? 2 : 0;

    const riskTierCode =
      data.riskTier === 'high' ? 3 : data.riskTier === 'medium' ? 2 : 1;

    const updated: ComplianceProfile = {
      ...existing,
      userId,
      walletAddress: data.walletAddress || existing.walletAddress,
      kycStatus: data.kycStatus || existing.kycStatus,
      kycStatusCode,
      jurisdiction: data.jurisdiction || existing.jurisdiction,
      jurisdictionCode: data.jurisdictionCode || existing.jurisdictionCode,
      riskTier: data.riskTier || existing.riskTier,
      riskTierCode,
      transferPermission: data.transferPermission !== undefined ? data.transferPermission : existing.transferPermission,
      isWhitelisted: (data.kycStatus === 'approved' || existing.kycStatus === 'approved') && (data.transferPermission !== undefined ? data.transferPermission : existing.transferPermission),
      updatedAt: new Date().toISOString(),
    };

    complianceStore.set(userId, updated);
    complianceCache.set(userId.toLowerCase(), { profile: updated, cachedAt: Date.now() });
    if (updated.walletAddress) {
      complianceCache.set(updated.walletAddress.toLowerCase(), { profile: updated, cachedAt: Date.now() });
    }

    try {
      const { error } = await supabaseAdmin.from('compliance_profiles').upsert({
        user_id: updated.userId,
        wallet_address: updated.walletAddress,
        kyc_status: updated.kycStatus,
        kyc_status_code: updated.kycStatusCode,
        jurisdiction: updated.jurisdiction,
        jurisdiction_code: updated.jurisdictionCode,
        risk_tier: updated.riskTier,
        risk_tier_code: updated.riskTierCode,
        transfer_permission: updated.transferPermission,
        is_whitelisted: updated.isWhitelisted,
        erc3643_compatible: updated.erc3643Compatible,
        updated_at: updated.updatedAt,
      });

      if (error) {
        if (env.NODE_ENV === 'production') {
          console.error(`[ComplianceService] 🚨 CRITICAL PROD FAILURE: Compliance write failed for ${userId}:`, error.message);
          throw new ServiceUnavailableError(`Compliance persistence failure: ${error.message}`);
        } else {
          console.warn(`[ComplianceService] ⚠️ Dev Mode Warning: Supabase write failed for compliance profile:`, error.message);
        }
      }
    } catch (err: any) {
      if (env.NODE_ENV === 'production') {
        throw err instanceof ServiceUnavailableError ? err : new ServiceUnavailableError(`Compliance store failure: ${err.message}`);
      }
    }

    auditService.log(
      'kyc_approved',
      adminId,
      'admin',
      `Compliance profile updated for user ${userId}: KYC=${updated.kycStatus}, RiskTier=${updated.riskTier}, TransferPermission=${updated.transferPermission}`,
      { userId, profile: updated }
    );

    return updated;
  }
}

export const complianceService = new ComplianceService();

