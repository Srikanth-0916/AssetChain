/**
 * Pagination helper utilities.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(
  queryPage?: string | number,
  queryLimit?: string | number
): PaginationParams {
  const page = Math.max(1, Number(queryPage) || 1);
  const limit = Math.min(100, Math.max(1, Number(queryLimit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}
