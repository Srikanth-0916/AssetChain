/**
 * OCR Service — Document text extraction.
 * In production: use Google Document AI or Tesseract.js.
 * In demo mode: simulates extracted fields from an IPFS document CID.
 */
export class OCRService {
  async extractFromCid(cid: string): Promise<Record<string, string>> {
    // Simulate OCR extraction based on the CID hash
    const seed = cid.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const ownerNames = ['Alexandra Chen', 'Michael Patel', 'Sarah Rodriguez', 'James O\'Brien'];
    const propertyTypes = ['Freehold Commercial Property', 'Leasehold Residential Flat', 'Industrial Warehouse', 'Solar Energy Facility'];

    return {
      documentType: seed % 2 === 0 ? 'Property Title Deed' : 'Asset Valuation Report',
      ownerName: ownerNames[seed % ownerNames.length],
      propertyType: propertyTypes[seed % propertyTypes.length],
      registrationNumber: `REG-${(seed * 7919).toString().slice(0, 8)}`,
      valuationDate: new Date(Date.now() - seed * 86400000).toISOString().split('T')[0],
      issuerAuthority: 'National Property Registry Authority',
      legalStatus: 'Clear Title, No Encumbrances',
      extractedAt: new Date().toISOString(),
    };
  }

  async extractFromUrl(url: string): Promise<Record<string, string>> {
    return this.extractFromCid(url);
  }
}

export const ocrService = new OCRService();
