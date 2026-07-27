import { assetService } from '../../services/asset.service';

export interface DuplicateResult {
  isDuplicate: boolean;
  confidence: number;
  matches: Array<{ id: string; title: string; location: string; similarity: number }>;
}

/**
 * Duplicate Detection Service — checks for near-duplicate asset submissions.
 */
export class DuplicateService {
  async checkForDuplicates(title: string, location: string, valuation: number): Promise<DuplicateResult> {
    const { assets } = await assetService.getMarketplaceAssets({ limit: '50' });

    const matches: DuplicateResult['matches'] = [];

    for (const asset of assets) {
      const titleSim = this.stringSimilarity(title.toLowerCase(), asset.title.toLowerCase());
      const locSim = location && asset.location
        ? this.stringSimilarity(location.toLowerCase(), asset.location.toLowerCase())
        : 0;
      const valSim = 1 - Math.abs(valuation - asset.valuation) / Math.max(valuation, asset.valuation);

      const similarity = titleSim * 0.5 + locSim * 0.3 + valSim * 0.2;

      if (similarity > 0.6) {
        matches.push({ id: asset.id, title: asset.title, location: asset.location, similarity });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);

    return {
      isDuplicate: matches.some((m) => m.similarity > 0.85),
      confidence: matches.length > 0 ? matches[0].similarity : 0,
      matches: matches.slice(0, 3),
    };
  }

  private stringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Jaccard similarity on word sets
    const setA = new Set(a.split(/\s+/));
    const setB = new Set(b.split(/\s+/));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }
}

export const duplicateService = new DuplicateService();
