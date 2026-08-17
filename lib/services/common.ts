// Shared data-access helpers. Every service function receives the tenant's
// agencyId and applies it to the query — this is the server-side enforcement
// of multi-tenant isolation (PLAN §18).

import prisma from "@/lib/prisma";
import { DEFAULT_TIMEZONE, normalizeTimezone } from "@/lib/timezone";

export type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function paginate(page: number, pageSize: number) {
  const p = Math.max(1, Math.floor(page));
  const size = Math.min(100, Math.max(1, Math.floor(pageSize)));
  return { skip: (p - 1) * size, take: size, page: p, pageSize: size };
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export type SortDir = "asc" | "desc";

/**
 * Resolve the tenant's business timezone (Agency.timezone, default
 * Asia/Jakarta). DB columns stay UTC; only the day-boundary interpretation of
 * filters/reports uses this. Invalid stored values fall back to the default.
 */
export async function getAgencyTimezone(agencyId: string): Promise<string> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { timezone: true },
  });
  return normalizeTimezone(agency?.timezone ?? DEFAULT_TIMEZONE);
}

/**
 * String filter for user search. Case-insensitive on PostgreSQL via
 * `mode: "insensitive"` (ILIKE). The SQLite dev/test client has no `mode`
 * option in its generated types, but SQLite `LIKE` is case-insensitive for
 * ASCII by default and Prisma ignores unknown filter keys there — so the same
 * object literal works on both providers.
 */
export function containsInsensitive(q: string): { contains: string; mode: "insensitive" } {
  return { contains: q, mode: "insensitive" };
}
