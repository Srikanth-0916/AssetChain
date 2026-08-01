export interface KYCVerificationRequest {
  userId: string;
  fullName: string;
  dob: string;
  documentType: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID' | 'PAN';
  documentNumber: string;
  frontImageBase64?: string;
  backImageBase64?: string;
  selfieImageBase64?: string;
}

export interface KYCVerificationResult {
  userId: string;
  verificationId: string;
  overallStatus: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' | 'PROVIDER_NOT_CONFIGURED';
  livenessScore: number;
  faceMatchScore: number;
  provider: string;
  details: string;
  timestamp: string;
}

export interface IIdentityProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  verifyKYC(request: KYCVerificationRequest): Promise<KYCVerificationResult>;
  checkPEP(fullName: string, country?: string): Promise<{ isPEP: boolean; hits: string[] }>;
  checkAML(fullName: string, documentNumber?: string): Promise<{ isFlagged: boolean; riskScore: number }>;
}

export class HyperVergeAdapter implements IIdentityProvider {
  readonly providerName = 'HyperVerge AI Identity Engine';

  constructor(private apiKey?: string, private appId?: string) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.appId && this.apiKey !== 'mock_key');
  }

  async verifyKYC(request: KYCVerificationRequest): Promise<KYCVerificationResult> {
    if (!this.isConfigured()) {
      return {
        userId: request.userId,
        verificationId: `hv_unconf_${Date.now()}`,
        overallStatus: 'PROVIDER_NOT_CONFIGURED',
        livenessScore: 0,
        faceMatchScore: 0,
        provider: this.providerName,
        details: 'HyperVerge API Key / App ID not configured in environment settings.',
        timestamp: new Date().toISOString(),
      };
    }
    // Production call to HyperVerge API
    throw new Error('HyperVerge enterprise credentials required for live API call.');
  }

  async checkPEP(_fullName: string, _country?: string) {
    return { isPEP: false, hits: [] };
  }

  async checkAML(_fullName: string, _documentNumber?: string) {
    return { isFlagged: false, riskScore: 0 };
  }
}

export class SignzyAdapter implements IIdentityProvider {
  readonly providerName = 'Signzy Government ID API';

  constructor(private apiToken?: string) {}

  isConfigured(): boolean {
    return Boolean(this.apiToken && this.apiToken !== 'mock_key');
  }

  async verifyKYC(request: KYCVerificationRequest): Promise<KYCVerificationResult> {
    if (!this.isConfigured()) {
      return {
        userId: request.userId,
        verificationId: `signzy_unconf_${Date.now()}`,
        overallStatus: 'PROVIDER_NOT_CONFIGURED',
        livenessScore: 0,
        faceMatchScore: 0,
        provider: this.providerName,
        details: 'Signzy API Token not configured in environment settings.',
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('Signzy enterprise contract required for live API call.');
  }

  async checkPEP(_fullName: string, _country?: string) {
    return { isPEP: false, hits: [] };
  }

  async checkAML(_fullName: string, _documentNumber?: string) {
    return { isFlagged: false, riskScore: 0 };
  }
}

export class SandboxIdentityAdapter implements IIdentityProvider {
  readonly providerName = 'AssetChain Identity Verification Sandbox Engine';

  isConfigured(): boolean {
    return true;
  }

  async verifyKYC(request: KYCVerificationRequest): Promise<KYCVerificationResult> {
    const isSanctioned = request.fullName.toLowerCase().includes('sanction');
    const status = isSanctioned ? 'REJECTED' : 'APPROVED';

    return {
      userId: request.userId,
      verificationId: `sandbox_kyc_${Math.random().toString(36).substr(2, 9)}`,
      overallStatus: status,
      livenessScore: isSanctioned ? 20 : 98,
      faceMatchScore: isSanctioned ? 15 : 96,
      provider: this.providerName,
      details: isSanctioned
        ? 'Identity check flagged: Name present on test watchlist.'
        : 'Automated identity, liveness & document verification passed via verification engine.',
      timestamp: new Date().toISOString(),
    };
  }

  async checkPEP(fullName: string) {
    const isPEP = fullName.toLowerCase().includes('pep');
    return { isPEP, hits: isPEP ? ['Test PEP Watchlist Match'] : [] };
  }

  async checkAML(fullName: string) {
    const isFlagged = fullName.toLowerCase().includes('aml');
    return { isFlagged, riskScore: isFlagged ? 85 : 5 };
  }
}
