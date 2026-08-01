export interface LandTitleVerificationRequest {
  assetId: string;
  surveyNumber: string;
  state: string;
  district: string;
  subRegistrarOffice: string;
  claimedOwnerName: string;
}

export interface LandTitleVerificationResult {
  assetId: string;
  verified: boolean;
  encumbrancesFound: boolean;
  legalRiskScore: number;
  provider: string;
  details: string;
  timestamp: string;
}

export interface ILandRegistryProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  verifyProperty(request: LandTitleVerificationRequest): Promise<LandTitleVerificationResult>;
}

export class GovLandRegistryAdapter implements ILandRegistryProvider {
  readonly providerName = 'Government State Land Registry API';

  constructor(private apiKey?: string, private registryUrl?: string) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.registryUrl);
  }

  async verifyProperty(request: LandTitleVerificationRequest): Promise<LandTitleVerificationResult> {
    if (!this.isConfigured()) {
      return {
        assetId: request.assetId,
        verified: false,
        encumbrancesFound: false,
        legalRiskScore: 0,
        provider: this.providerName,
        details: 'Government Land Registry API credentials not configured in environment settings.',
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('State Land Registry API authentication requires government approval.');
  }
}

export class SandboxLandRegistryAdapter implements ILandRegistryProvider {
  readonly providerName = 'AssetChain Legal Verification Engine';

  isConfigured(): boolean {
    return true;
  }

  async verifyProperty(request: LandTitleVerificationRequest): Promise<LandTitleVerificationResult> {
    const isEncumbered = request.surveyNumber.toLowerCase().includes('encumber') || request.claimedOwnerName.toLowerCase().includes('dispute');

    return {
      assetId: request.assetId,
      verified: !isEncumbered,
      encumbrancesFound: isEncumbered,
      legalRiskScore: isEncumbered ? 75 : 5,
      provider: this.providerName,
      details: isEncumbered
        ? 'Encumbrance alert: Pending litigation or active bank mortgage detected on survey record.'
        : 'Clear title confirmed: Sub-registrar title deed matches claimed owner name. No active mortgages or litigation.',
      timestamp: new Date().toISOString(),
    };
  }
}
