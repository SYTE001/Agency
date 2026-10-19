export const DEFAULT_TIMEZONE = "Asia/Jakarta";

type YMD = { year: number; month: number; day: number };

const pad2 = (n: number) => String(n).padStart(2, "0");

export function normalizeTimezone(timeZone: string | null | undefined): string {
  if (!timeZone) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

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

function localToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  let utcMs = target;
  // Two iterations cover any DST transition offset shift
  for (let i = 0; i < 2; i++) {
    utcMs = target - tzOffsetMinutes(timeZone, new Date(utcMs)) * 60_000;
  }
  return new Date(utcMs);
}

export function dayStartInTz(timeZone: string, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  return localToUtc(tz, year, month, day);
}

export function dayEndInTz(timeZone: string, ref: Date = new Date()): Date {
  return new Date(dayStartInTz(timeZone, ref).getTime() + 86_400_000 - 1);
}

export function daysAgoStartInTz(timeZone: string, n: number, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  const shifted = new Date(Date.UTC(year, month - 1, day - n));
  return localToUtc(
    tz,
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

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

export function dateKeyInTz(timeZone: string, ref: Date = new Date()): string {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseDateKeyInTz(timeZone: string, key: string): Date | null {
  const ymd = parseYMD(key);
  if (!ymd) return null;
  return localToUtc(normalizeTimezone(timeZone), ymd.year, ymd.month, ymd.day);
}

export function shiftDateKey(
  key: string,
  delta: { days?: number; months?: number },
): string | null {
  const from = parseYMD(key);
  if (!from) return null;

  const months = delta.months ?? 0;
  const days = delta.days ?? 0;
  const anchor = new Date(Date.UTC(from.year, from.month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate();
  const shifted = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), Math.min(from.day, lastDay) + days),
  );

  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

export function startOfWeekInTz(timeZone: string, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month, day } = calendarDateInTz(tz, ref);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const monday = new Date(Date.UTC(year, month - 1, day - ((weekday + 6) % 7)));
  return localToUtc(tz, monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
}

export function monthStartInTz(timeZone: string, ref: Date = new Date()): Date {
  const tz = normalizeTimezone(timeZone);
  const { year, month } = calendarDateInTz(tz, ref);
  return localToUtc(tz, year, month, 1);
}

export function parseDateTimeLocalInTz(
  timeZone: string,
  value: string | null | undefined,
): Date | null {
  if (!value) return null;
  const str = value.trim();
  if (!str) return null;

  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(str);
  if (!m) {
    const fallback = new Date(str);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = m[4] !== undefined ? Number(m[4]) : 0;
  const minute = m[5] !== undefined ? Number(m[5]) : 0;
  const second = m[6] !== undefined ? Number(m[6]) : 0;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;

  return localToUtc(normalizeTimezone(timeZone), year, month, day, hour, minute, second);
}
