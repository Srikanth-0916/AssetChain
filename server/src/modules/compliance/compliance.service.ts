import { auditService } from '../audit/audit.service';

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

export class ComplianceService {
  async getProfile(userIdOrAddress: string): Promise<ComplianceProfile> {
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
