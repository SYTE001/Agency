// Timezone-aware day-boundary helpers.
//
// The database stores everything in UTC. Business-day filtering (reports, LIVE
// schedules, dashboard "today" windows) must therefore interpret a calendar day
// in the tenant's timezone — Agency.timezone (default Asia/Jakarta) — and convert
// the resulting local midnight boundaries back to UTC instants for the query.
//
// These helpers are dependency-free (Intl.DateTimeFormat only) and return UTC
// Date objects suitable for Prisma `gte`/`lte` comparisons.

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

/** Normalize an IANA timezone id, falling back to the default on anything invalid. */
export function normalizeTimezone(timeZone: string | null | undefined): string {
  if (!timeZone) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

type YMD = { year: number; month: number; day: number };

/** The calendar date (Y/M/D) of `ref` as seen in `timeZone`. */
function calendarDateInTz(timeZone: string, ref: Date): YMD {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(ref)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

/** Minutes the timezone is ahead of UTC at the given instant. */
function tzOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUTC - date.getTime()) / 60_000);
}

/** UTC instant of 00:00:00 on calendar date (y, m, d) in `timeZone`. */
function dayStartForDateInTz(timeZone: string, y: number, m: number, d: number): Date {
  // Start from a guess of local midnight expressed as if it were UTC, then pull
  // it back by the timezone offset. Two iterations cover any DST transition.
  const localMidnightAsUTC = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  let utcMs = localMidnightAsUTC;
  for (let i = 0; i < 2; i++) {
    utcMs = localMidnightAsUTC - tzOffsetMinutes(timeZone, new Date(utcMs)) * 60_000;
  }
  return new Date(utcMs);
}

/**
 * UTC instant of the start (local 00:00:00) of the calendar day containing
 * `ref` in `timeZone`.
 */
export function dayStartInTz(timeZone: string, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  return dayStartForDateInTz(tz, year, month, day);
}

/**
 * UTC instant of the end (local 23:59:59.999) of the calendar day containing
 * `ref` in `timeZone`.
 */
export function dayEndInTz(timeZone: string, ref: Date = new Date()): Date {
  return new Date(dayStartInTz(timeZone, ref).getTime() + 86_400_000 - 1);
}

/**
 * UTC instant of local midnight `n` calendar days before the day containing
 * `ref` in `timeZone`. `n = 0` is today's local midnight; positive `n` goes back.
 */
export function daysAgoStartInTz(timeZone: string, n: number, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  // Date.UTC normalizes out-of-range day values (e.g. day 0 → previous month).
  const shifted = new Date(Date.UTC(year, month - 1, day - n));
  return dayStartForDateInTz(
    tz,
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}
