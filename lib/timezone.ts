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

// ---------------------------------------------------------------------------
// Calendar-key helpers (LIVE schedule grid & URL navigation). The grid works
// on "YYYY-MM-DD" keys interpreted in the tenant's timezone so day placement
// never depends on the server's runtime timezone, and stays correct across
// DST transitions (keys are calendar dates, not 24h multiples).
// ---------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse a strict "YYYY-MM-DD" key; null when malformed or an impossible date (Feb 30). */
function parseYMD(key: string): YMD | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return { year, month, day };
}

/** "YYYY-MM-DD" of the calendar day containing `ref`, as seen in `timeZone`. */
export function dateKeyInTz(timeZone: string, ref: Date = new Date()): string {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * UTC instant of local midnight (00:00) on the "YYYY-MM-DD" calendar date in
 * `timeZone`. Returns null for malformed/impossible keys so callers can fall
 * back to "today" instead of silently rolling over to another day.
 */
export function parseDateKeyInTz(timeZone: string, key: string): Date | null {
  const ymd = parseYMD(key);
  if (!ymd) return null;
  return dayStartForDateInTz(normalizeTimezone(timeZone), ymd.year, ymd.month, ymd.day);
}

/**
 * Shift a "YYYY-MM-DD" key by whole calendar days and/or months. Pure calendar
 * arithmetic (no timezone math needed): month-end clamps (Jan 31 → Feb 28) and
 * year rollovers normalize via UTC-date arithmetic. Null for invalid keys.
 */
export function shiftDateKey(
  key: string,
  delta: { days?: number; months?: number },
): string | null {
  const from = parseYMD(key);
  if (!from) return null;
  const months = delta.months ?? 0;
  const days = delta.days ?? 0;
  const anchor = new Date(Date.UTC(from.year, from.month - 1 + months, 1));
  // Clamp the day to the target month's length before adding days.
  const lastDay = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate();
  const shifted = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), Math.min(from.day, lastDay) + days));
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/**
 * UTC instant of local midnight on Monday of the week containing `ref`, weeks
 * starting Monday (id-ID business convention), in `timeZone`.
 */
export function startOfWeekInTz(timeZone: string, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  // Weekday of the LOCAL calendar date — weekday is a property of the date
  // itself, so UTC arithmetic on the Y/M/D triple gives the right answer.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun…6=Sat
  const monday = new Date(Date.UTC(year, month - 1, day - ((weekday + 6) % 7)));
  return dayStartForDateInTz(tz, monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
}

/** UTC instant of local midnight on the first day of `ref`'s month in `timeZone`. */
export function monthStartInTz(timeZone: string, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month } = calendarDateInTz(tz, ref);
  return dayStartForDateInTz(tz, year, month, 1);
}
