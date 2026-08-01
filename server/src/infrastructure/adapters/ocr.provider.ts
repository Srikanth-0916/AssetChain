export interface OCRScanRequest {
  documentId: string;
  fileBuffer?: Buffer;
  imageBase64?: string;
  documentType: 'TITLE_DEED' | 'TAX_RECEIPT' | 'PASSPORT' | 'COMMERCIAL_LEASE';
}

export interface OCRScanResult {
  documentId: string;
  extractedText: string;
  confidenceScore: number;
  extractedFields: Record<string, string>;
  provider: string;
  timestamp: string;
}

export interface IOCREngineProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  scanDocument(request: OCRScanRequest): Promise<OCRScanResult>;
}

export class GoogleVisionOCRAdapter implements IOCREngineProvider {
  readonly providerName = 'Google Cloud Vision OCR API';

  constructor(private apiKey?: string) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'mock_key');
  }

  async scanDocument(request: OCRScanRequest): Promise<OCRScanResult> {
    if (!this.isConfigured()) {
      return {
        documentId: request.documentId,
        extractedText: '',
        confidenceScore: 0,
        extractedFields: {},
        provider: this.providerName,
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error('Google Cloud Vision API key required for live document OCR scanning.');
  }
}

export class SandboxOCRAdapter implements IOCREngineProvider {
  readonly providerName = 'AssetChain Intelligent Document Processor';

  isConfigured(): boolean {
    return true;
  }

  async scanDocument(request: OCRScanRequest): Promise<OCRScanResult> {
    return {
      documentId: request.documentId,
      extractedText: `Extracted metadata for document type ${request.documentType}. Survey Number: SUR-8849-B. Valuer: Knight Frank. Valuation: $1,250,000 USD.`,
      confidenceScore: 97.4,
      extractedFields: {
        documentType: request.documentType,
        surveyNumber: 'SUR-8849-B',
        issuer: 'Sub-Registrar Office IV',
        issuanceDate: '2025-01-15',
        valuationAmount: '1250000',
        currency: 'USD',
      },
      provider: this.providerName,
      timestamp: new Date().toISOString(),
    };
  }
}
