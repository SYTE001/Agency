import { cache } from "react";
import prisma from "@/lib/prisma";
import { isSqliteProvider } from "@/lib/dbProvider";
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

export const getAgencyTimezone = cache(async function getAgencyTimezone(
  agencyId: string,
): Promise<string> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { timezone: true },
  });
  return normalizeTimezone(agency?.timezone ?? DEFAULT_TIMEZONE);
});

export function containsInsensitive(q: string): { contains: string; mode?: "insensitive" } {
  return isSqliteProvider() ? { contains: q } : { contains: q, mode: "insensitive" };
}

