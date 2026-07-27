/**
 * Standard API response types.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
