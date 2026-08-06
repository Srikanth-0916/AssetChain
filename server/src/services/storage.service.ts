import { supabaseAdmin } from '../config/database';
import { auditService } from '../modules/audit/audit.service';
import { BadRequestError, ForbiddenError, UnprocessableError, InternalServerError } from '../utils/errors';
import { ALLOWED_MIME_TYPES, FORBIDDEN_EXTENSIONS, MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE } from '../middleware/upload.middleware';

export type AllowedBucket = 'avatars' | 'property-images' | 'asset-documents' | 'user-documents';
export type UserRole = 'admin' | 'asset_owner' | 'investor' | 'verifier' | 'legal_reviewer';

export class StorageService {
  private allowedBuckets: AllowedBucket[] = ['avatars', 'property-images', 'asset-documents', 'user-documents'];

  /**
   * Validate storage bucket name.
   */
  validateBucket(bucket: string): AllowedBucket {
    if (!this.allowedBuckets.includes(bucket as AllowedBucket)) {
      throw new BadRequestError(`Invalid storage bucket '${bucket}'. Allowed buckets: ${this.allowedBuckets.join(', ')}`);
    }
    return bucket as AllowedBucket;
  }

  /**
   * Validate file mime type, file size limits, and security constraints.
   */
  validateFile(fileBuffer: Buffer, mimeType: string, filename: string, bucket: AllowedBucket): void {
    const originalName = filename.toLowerCase();

    // Security check: directory traversal
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      throw new BadRequestError('Invalid file name: Potential directory traversal attack detected');
    }

    // Security check: forbidden extensions
    if (FORBIDDEN_EXTENSIONS.some((ext) => originalName.endsWith(ext))) {
      throw new UnprocessableError(`File type rejected. Forbidden executable extension in file ${filename}`);
    }

    // MIME type check
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new UnprocessableError(`Invalid MIME type '${mimeType}'. Allowed formats: jpg, jpeg, png, pdf.`);
    }

    // Size limit check
    if (mimeType.startsWith('image/') && fileBuffer.length > MAX_IMAGE_SIZE) {
      throw new UnprocessableError(`Image size exceeds 5MB limit. Current size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
    }

    if (mimeType === 'application/pdf' && fileBuffer.length > MAX_DOCUMENT_SIZE) {
      throw new UnprocessableError(`PDF document size exceeds 10MB limit. Current size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
    }
  }

  /**
   * Ownership & RBAC Permission Validator based on public.profiles.role.
   */
  validateOwnership(
    actorId: string,
    actorRole: UserRole,
    bucket: AllowedBucket,
    path: string,
    action: 'upload' | 'read' | 'delete' | 'replace'
  ): void {
    // Admin has full access to all buckets and actions
    if (actorRole === 'admin') return;

    const pathOwnerId = path.split('/')[0];

    switch (bucket) {
      case 'avatars': {
        if (action === 'read') return; // Avatars can be read by authenticated users
        if (pathOwnerId !== actorId) {
          this.logPermissionFailure(actorId, actorRole, action, bucket, path, 'Users can only modify their own avatar');
          throw new ForbiddenError('Permission denied: You can only upload/modify/delete your own avatar.');
        }
        break;
      }
      case 'property-images': {
        if (action === 'read') {
          // Investor, verifier, legal_reviewer, asset_owner can read property images
          if (['asset_owner', 'investor', 'verifier', 'legal_reviewer'].includes(actorRole)) return;
        } else {
          // Only asset_owner can upload/replace/delete their own property images
          if (actorRole !== 'asset_owner' || pathOwnerId !== actorId) {
            this.logPermissionFailure(actorId, actorRole, action, bucket, path, 'Only Asset Owners can upload/modify property images in their directory');
            throw new ForbiddenError('Permission denied: Only Asset Owners can upload or delete property images.');
          }
        }
        break;
      }
      case 'asset-documents': {
        if (action === 'read') {
          if (pathOwnerId === actorId || ['verifier', 'legal_reviewer'].includes(actorRole)) return;
        } else {
          if (actorRole !== 'asset_owner' || pathOwnerId !== actorId) {
            this.logPermissionFailure(actorId, actorRole, action, bucket, path, 'Only Asset Owners can upload asset documents');
            throw new ForbiddenError('Permission denied: Only Asset Owners can upload asset documents.');
          }
        }
        break;
      }
      case 'user-documents': {
        if (action === 'read') {
          if (pathOwnerId === actorId || ['verifier', 'legal_reviewer'].includes(actorRole)) return;
        } else {
          if (pathOwnerId !== actorId) {
            this.logPermissionFailure(actorId, actorRole, action, bucket, path, 'Users can only upload their own KYC documents');
            throw new ForbiddenError('Permission denied: You can only upload or manage your own KYC documents.');
          }
        }
        break;
      }
      default:
        throw new BadRequestError(`Unknown bucket '${bucket}'`);
    }
  }

  /**
   * Upload file to Supabase Storage with retry logic and audit logging.
   */
  async uploadFile(
    bucket: AllowedBucket,
    path: string,
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    actorId: string,
    actorRole: UserRole
  ): Promise<{ path: string; url: string; bucket: AllowedBucket }> {
    this.validateBucket(bucket);
    this.validateOwnership(actorId, actorRole, bucket, path, 'upload');
    this.validateFile(fileBuffer, mimeType, filename, bucket);

    let attempts = 0;
    const maxRetries = 3;
    let lastError: any = null;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const { error } = await supabaseAdmin.storage
          .from(bucket)
          .upload(path, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error) {
          const publicUrl = this.getPublicUrl(bucket, path);

          // Audit log successful upload
          auditService.log({
            type: 'admin_action',
            actorId,
            actorRole,
            description: `File uploaded to bucket '${bucket}' at path '${path}'`,
            metadata: { bucket, path, filename, mimeType, size: fileBuffer.length, publicUrl },
            severity: 'info',
          });

          return { path, url: publicUrl, bucket };
        }

        lastError = error;
        console.warn(`[StorageService] Upload attempt ${attempts} failed for ${path}: ${error.message}`);
      } catch (err: any) {
        lastError = err;
      }
    }

    // Log failure in audit log
    auditService.log({
      type: 'security_alert',
      actorId,
      actorRole,
      description: `Storage upload failed after ${maxRetries} attempts for bucket '${bucket}' at path '${path}'`,
      metadata: { bucket, path, error: lastError?.message || String(lastError) },
      severity: 'warning',
    });

    throw new InternalServerError(`Failed to upload file to storage: ${lastError?.message || 'Storage write error'}`);
  }

  /**
   * Delete file from Supabase Storage with audit logging.
   */
  async deleteFile(bucket: AllowedBucket, path: string, actorId: string, actorRole: UserRole): Promise<boolean> {
    this.validateBucket(bucket);
    this.validateOwnership(actorId, actorRole, bucket, path, 'delete');

    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      auditService.log({
        type: 'security_alert',
        actorId,
        actorRole,
        description: `Failed to delete file from bucket '${bucket}' at path '${path}'`,
        metadata: { bucket, path, error: error.message },
        severity: 'warning',
      });
      throw new InternalServerError(`Delete operation failed: ${error.message}`);
    }

    auditService.log({
      type: 'admin_action',
      actorId,
      actorRole,
      description: `File deleted from bucket '${bucket}' at path '${path}'`,
      metadata: { bucket, path },
      severity: 'info',
    });

    return true;
  }

  /**
   * Generate Public URL for open access buckets.
   */
  getPublicUrl(bucket: AllowedBucket, path: string): string {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Generate Signed URL for private buckets (`asset-documents`, `user-documents`).
   */
  async getSignedUrl(
    bucket: AllowedBucket,
    path: string,
    expiresInSeconds = 3600,
    actorId: string,
    actorRole: UserRole
  ): Promise<string> {
    this.validateBucket(bucket);
    this.validateOwnership(actorId, actorRole, bucket, path, 'read');

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new InternalServerError(`Failed to generate signed URL for path '${path}'`);
    }

    auditService.log({
      type: 'admin_action',
      actorId,
      actorRole,
      description: `Signed download URL generated for bucket '${bucket}' path '${path}'`,
      metadata: { bucket, path, expiresInSeconds },
      severity: 'info',
    });

    return data.signedUrl;
  }

  /**
   * Helper to log permission failures to audit_logs.
   */
  private logPermissionFailure(
    actorId: string,
    actorRole: UserRole,
    action: string,
    bucket: AllowedBucket,
    path: string,
    reason: string
  ): void {
    auditService.log({
      type: 'security_alert',
      actorId,
      actorRole,
      description: `Unauthorized storage access attempt (${action}) on bucket '${bucket}' at path '${path}'`,
      metadata: { action, bucket, path, reason },
      severity: 'warning',
    });
  }
}

export const storageService = new StorageService();
