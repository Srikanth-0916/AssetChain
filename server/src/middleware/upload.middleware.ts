import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { BadRequestError, UnprocessableError } from '../utils/errors';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

export const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.zip',
  '.js',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.vbs',
  '.tar',
  '.gz',
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Storage Engine: Memory Storage (Buffer)
 */
const storage = multer.memoryStorage();

/**
 * Custom Multer file filter to validate file type and block malicious extensions.
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const originalName = file.originalname.toLowerCase();

  // Directory traversal check
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    return cb(new BadRequestError('Invalid file name: Potential directory traversal detected'));
  }

  // Forbidden extension check
  const hasForbiddenExt = FORBIDDEN_EXTENSIONS.some((ext) => originalName.endsWith(ext));
  if (hasForbiddenExt) {
    return cb(
      new UnprocessableError(
        `File type rejected. Dangerous file extensions (${FORBIDDEN_EXTENSIONS.join(
          ', '
        )}) are strictly forbidden.`
      )
    );
  }

  // Allowed MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new UnprocessableError(
        `Unsupported MIME type (${file.mimetype}). Allowed types: jpg, jpeg, png, pdf.`
      )
    );
  }

  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE, // Max bound 10MB
    files: 5,
  },
  fileFilter,
});
