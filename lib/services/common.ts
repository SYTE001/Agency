// Shared data-access helpers. Every service function receives the tenant's
// agencyId and applies it to the query — this is the server-side enforcement
// of multi-tenant isolation (PLAN §18).

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

export function daysAgoDate(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
