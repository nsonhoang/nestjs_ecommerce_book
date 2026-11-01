// src/common/utils/pagination.util.ts
import { PaginationMeta } from 'src/common/types/paginated-result.type';

export function getPagination(page?: number, limit?: number) {
  const safePage = Math.max(1, page || 1);
  const safeLimit = Math.min(100, Math.max(1, limit || 10));
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

export function buildMeta(
  page: number,
  limit: number,
  total: number,
  nextCursor?: string | null,
  hasNextPage?: boolean,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: hasNextPage ?? page < totalPages,
    nextCursor: nextCursor ?? null,
  };
}

export function buildCursorMeta(
  limit: number,
  hasNextPage: boolean,
  nextCursor: string | null,
): PaginationMeta {
  return {
    limit,
    hasNextPage,
    nextCursor,
  };
}

export function paginateCursorItems<T extends { id: string }>(
  items: T[],
  limit: number,
): { data: T[]; hasNextPage: boolean; nextCursor: string | null } {
  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, -1) : items;
  const nextCursor =
    hasNextPage && data.length > 0 ? data[data.length - 1].id : null;

  return {
    data,
    hasNextPage,
    nextCursor,
  };
}
