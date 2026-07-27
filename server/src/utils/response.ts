import { Response } from 'express';

/**
 * Standard API response helpers.
 * All responses follow the envelope pattern: { success, data, meta?, error? }
 */

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string>[]
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
