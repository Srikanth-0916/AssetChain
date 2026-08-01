/**
 * Pinata IPFS Service
 * Interacts with Pinata API for pinning real-world asset metadata and legal documents to IPFS.
 */

import { env } from '../config/env';

export interface PinataPinResult {
  ipfsCid: string;
  ipfsUrl: string;
  pinSize: number;
  timestamp: string;
  isMock: boolean;
}

export class IPFSService {
  private readonly pinataApiKey: string;
  private readonly pinataSecretKey: string;
  private readonly pinataJwt: string;
  private readonly gatewayUrl: string;

  constructor() {
    this.pinataApiKey = env.PINATA_API_KEY || '';
    this.pinataSecretKey = (env.PINATA_SECRET_KEY && env.PINATA_SECRET_KEY !== 'mock_key')
      ? env.PINATA_SECRET_KEY
      : (env.PINATA_API_SECRET || '');
    this.pinataJwt = env.PINATA_JWT || '';
    this.gatewayUrl = env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
  }

  /** Check if live Pinata API credentials or JWT are configured */
  isConfigured(): boolean {
    if (this.pinataJwt && this.pinataJwt.length > 20) return true;
    return (
      !!this.pinataApiKey &&
      !!this.pinataSecretKey &&
      this.pinataApiKey !== 'mock_key' &&
      this.pinataSecretKey !== 'mock_key'
    );
  }

  /** Build authentication headers for fetch requests */
  private getAuthHeaders(): Record<string, string> {
    if (this.pinataJwt && this.pinataJwt.length > 20) {
      return {
        Authorization: `Bearer ${this.pinataJwt}`,
      };
    }
    return {
      pinata_api_key: this.pinataApiKey,
      pinata_secret_api_key: this.pinataSecretKey,
    };
  }

  /** Test authentication with Pinata API */
  async testConnection(): Promise<{ success: boolean; message: string; isMock: boolean }> {
    if (!this.isConfigured()) {
      return {
        success: true,
        message: 'Running in Mock/Fallback Mode (PINATA_API_KEY is mock_key or empty)',
        isMock: true,
      };
    }

    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Pinata Auth Failed (HTTP ${response.status}): ${errorText}`,
          isMock: false,
        };
      }

      const data: any = await response.json();
      return {
        success: true,
        message: data.message || 'Successfully authenticated with Pinata IPFS API',
        isMock: false,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Pinata Connection Error: ${err.message}`,
        isMock: false,
      };
    }
  }

  /** Pin JSON metadata (e.g. Asset Metadata, Title Deed summary) to IPFS */
  async pinJSONToIPFS(content: Record<string, any>, name: string): Promise<PinataPinResult> {
    if (!this.isConfigured()) {
      const mockHash = `Qm${Buffer.from(JSON.stringify(content)).toString('hex').substring(0, 44)}`;
      return {
        ipfsCid: mockHash,
        ipfsUrl: `${this.gatewayUrl}/${mockHash}`,
        pinSize: JSON.stringify(content).length,
        timestamp: new Date().toISOString(),
        isMock: true,
      };
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          pinataContent: content,
          pinataMetadata: { name },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Pinata pinJSON HTTP ${response.status}: ${errText}`);
      }

      const resData: any = await response.json();
      const cid = resData.IpfsHash;

      return {
        ipfsCid: cid,
        ipfsUrl: `${this.gatewayUrl}/${cid}`,
        pinSize: resData.PinSize || 0,
        timestamp: resData.Timestamp || new Date().toISOString(),
        isMock: false,
      };
    } catch (err: any) {
      console.warn(`[IPFSService] Live Pinata pin failed (${err.message}). Falling back to deterministic CID.`);
      const mockHash = `Qm${Buffer.from(name + Date.now()).toString('hex').substring(0, 44)}`;
      return {
        ipfsCid: mockHash,
        ipfsUrl: `${this.gatewayUrl}/${mockHash}`,
        pinSize: 0,
        timestamp: new Date().toISOString(),
        isMock: true,
      };
    }
  }
}

export const ipfsService = new IPFSService();
