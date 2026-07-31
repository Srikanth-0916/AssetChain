import { describe, it, expect } from 'vitest';
import { ipfsService } from '../src/services/ipfs.service';

describe('Pinata IPFS Service Integration', () => {
  it('Should check Pinata configuration status', () => {
    const isConfigured = ipfsService.isConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });

  it('Should run Pinata connection test', async () => {
    const result = await ipfsService.testConnection();
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });

  it('Should pin JSON metadata to IPFS (Live or Fallback Mode)', async () => {
    const metadata = {
      assetName: 'Manhattan Commercial Plaza',
      valuation: 500000,
      spvEntity: 'Delaware SPV LLC',
    };

    const pinResult = await ipfsService.pinJSONToIPFS(metadata, 'manhattan_plaza.json');
    expect(pinResult.ipfsCid).toBeDefined();
    expect(pinResult.ipfsCid.length).toBeGreaterThan(10);
    expect(pinResult.ipfsUrl).toContain('ipfs');
  });
});
