import { Request, Response, NextFunction } from 'express';
import { storageService, AllowedBucket, UserRole } from '../services/storage.service';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class StorageController {
  /**
   * POST /storage/upload
   * Authenticated user uploads file to storage bucket.
   */
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No file provided in form-data field "file"');
      }

      const bucket = req.body.bucket as AllowedBucket;
      if (!bucket) {
        throw new BadRequestError('Parameter "bucket" is required in request body');
      }

      const user = req.user!;
      const customFilename = req.body.filename || `${uuidv4()}-${req.file.originalname}`;
      const storagePath = `${user.userId}/${customFilename}`;

      const result = await storageService.uploadFile(
        bucket,
        storagePath,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        user.userId,
        user.role as UserRole
      );

      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /storage/signed-url
   * Generate temporary signed URL for file access.
   */
  async getSignedUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bucket = req.query.bucket as AllowedBucket;
      const path = req.query.path as string;

      if (!bucket || !path) {
        throw new BadRequestError('Query parameters "bucket" and "path" are required');
      }

      const user = req.user!;
      const signedUrl = await storageService.getSignedUrl(
        bucket,
        path,
        3600,
        user.userId,
        user.role as UserRole
      );

      sendSuccess(res, { signedUrl, path, bucket });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /storage/file
   * Delete file from storage.
   */
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bucket = req.body.bucket as AllowedBucket;
      const path = req.body.path as string;

      if (!bucket || !path) {
        throw new BadRequestError('Request body parameters "bucket" and "path" are required');
      }

      const user = req.user!;
      await storageService.deleteFile(bucket, path, user.userId, user.role as UserRole);

      sendSuccess(res, { message: 'File deleted successfully', path, bucket });
    } catch (error) {
      next(error);
    }
  }
}

export const storageController = new StorageController();
