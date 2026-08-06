import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../src/services/storage.service';
import { auditService } from '../src/modules/audit/audit.service';
import { ForbiddenError, UnprocessableError, BadRequestError } from '../src/utils/errors';

describe('StorageService Integration & Security Test Suite', () => {
  const ownerId = 'owner-uuid-101';
  const investorId = 'investor-uuid-202';
  const verifierId = 'verifier-uuid-303';
  const legalId = 'legal-uuid-404';
  const adminId = 'admin-uuid-505';

  it('1. Owner can validate ownership and upload property image', () => {
    const validImageBuffer = Buffer.alloc(1024 * 1024); // 1MB image
    expect(() =>
      storageService.validateOwnership(ownerId, 'asset_owner', 'property-images', `${ownerId}/house.jpeg`, 'upload')
    ).not.toThrow();

    expect(() =>
      storageService.validateFile(validImageBuffer, 'image/jpeg', 'house.jpeg', 'property-images')
    ).not.toThrow();
  });

  it('2. Owner can validate ownership and upload title deed (asset-documents)', () => {
    const validPdfBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB PDF
    expect(() =>
      storageService.validateOwnership(ownerId, 'asset_owner', 'asset-documents', `${ownerId}/deed.pdf`, 'upload')
    ).not.toThrow();

    expect(() =>
      storageService.validateFile(validPdfBuffer, 'application/pdf', 'deed.pdf', 'asset-documents')
    ).not.toThrow();
  });

  it('3. Owner can delete own image', () => {
    expect(() =>
      storageService.validateOwnership(ownerId, 'asset_owner', 'property-images', `${ownerId}/house.jpeg`, 'delete')
    ).not.toThrow();
  });

  it('4. Investor CANNOT upload property image or asset document', () => {
    expect(() =>
      storageService.validateOwnership(investorId, 'investor', 'property-images', `${investorId}/villa.png`, 'upload')
    ).toThrow(ForbiddenError);

    expect(() =>
      storageService.validateOwnership(investorId, 'investor', 'asset-documents', `${investorId}/contract.pdf`, 'upload')
    ).toThrow(ForbiddenError);
  });

  it('5. Investor CAN view property image', () => {
    expect(() =>
      storageService.validateOwnership(investorId, 'investor', 'property-images', `${ownerId}/house.jpeg`, 'read')
    ).not.toThrow();
  });

  it('6. Verifier can read asset document', () => {
    expect(() =>
      storageService.validateOwnership(verifierId, 'verifier', 'asset-documents', `${ownerId}/deed.pdf`, 'read')
    ).not.toThrow();
  });

  it('7. Legal reviewer can read asset document', () => {
    expect(() =>
      storageService.validateOwnership(legalId, 'legal_reviewer', 'asset-documents', `${ownerId}/deed.pdf`, 'read')
    ).not.toThrow();
  });

  it('8. Verifier / Legal / Admin can read user KYC documents', () => {
    expect(() =>
      storageService.validateOwnership(verifierId, 'verifier', 'user-documents', `${investorId}/kyc.pdf`, 'read')
    ).not.toThrow();

    expect(() =>
      storageService.validateOwnership(legalId, 'legal_reviewer', 'user-documents', `${investorId}/kyc.pdf`, 'read')
    ).not.toThrow();
  });

  it('9. Admin has full access to delete or manage everything', () => {
    expect(() =>
      storageService.validateOwnership(adminId, 'admin', 'property-images', `${ownerId}/house.jpeg`, 'delete')
    ).not.toThrow();

    expect(() =>
      storageService.validateOwnership(adminId, 'admin', 'user-documents', `${investorId}/passport.pdf`, 'delete')
    ).not.toThrow();
  });

  it('10. Wrong role or cross-user upload/delete is rejected', () => {
    expect(() =>
      storageService.validateOwnership(investorId, 'investor', 'property-images', `${ownerId}/other-user-file.png`, 'delete')
    ).toThrow(ForbiddenError);

    expect(() =>
      storageService.validateOwnership(ownerId, 'asset_owner', 'avatars', `${investorId}/other-avatar.png`, 'upload')
    ).toThrow(ForbiddenError);
  });

  it('11. Oversized file is rejected', () => {
    const oversizedImage = Buffer.alloc(6 * 1024 * 1024); // 6MB > 5MB limit
    expect(() =>
      storageService.validateFile(oversizedImage, 'image/png', 'huge.png', 'property-images')
    ).toThrow(UnprocessableError);

    const oversizedPdf = Buffer.alloc(11 * 1024 * 1024); // 11MB > 10MB limit
    expect(() =>
      storageService.validateFile(oversizedPdf, 'application/pdf', 'huge.pdf', 'asset-documents')
    ).toThrow(UnprocessableError);
  });

  it('12. Invalid file type / dangerous extension is rejected', () => {
    const fakeExeBuffer = Buffer.from('MZ...executable');
    expect(() =>
      storageService.validateFile(fakeExeBuffer, 'application/x-msdownload', 'malware.exe', 'avatars')
    ).toThrow(UnprocessableError);

    expect(() =>
      storageService.validateFile(fakeExeBuffer, 'text/javascript', 'script.js', 'asset-documents')
    ).toThrow(UnprocessableError);
  });

  it('13. Directory traversal attempt is rejected', () => {
    const validBuffer = Buffer.alloc(100);
    expect(() =>
      storageService.validateFile(validBuffer, 'image/png', '../etc/passwd', 'avatars')
    ).toThrow(BadRequestError);
  });

  it('14. Failed permission attempts generate security alert audit logs', () => {
    try {
      storageService.validateOwnership(investorId, 'investor', 'asset-documents', `${ownerId}/secret.pdf`, 'delete');
    } catch {
      // Expected ForbiddenError
    }

    const auditLogs = auditService.getLogBySeverity('warning');
    const hasAlert = auditLogs.some(
      (log) => log.type === 'security_alert' && log.description.includes('Unauthorized storage access attempt')
    );
    expect(hasAlert).toBe(true);
  });
});
