// Formatting helpers. Indonesian (id-ID) conventions throughout.
//
// Date/time formatting is timezone-aware: every formatter accepts an optional
// IANA `timeZone` (the authenticated tenant's Agency.timezone) and falls back
// to the app default (Asia/Jakarta — lib/timezone DEFAULT_TIMEZONE) when
// omitted. Nothing here ever uses the server's runtime timezone, so rendered
// dates match the tenant's calendar regardless of where the app runs.
import { DEFAULT_TIMEZONE, normalizeTimezone } from "@/lib/timezone";

/** Accepts plain numbers and Prisma Decimal objects (monetary values are whole Rupiah). */
type DecimalLike = number | { toNumber(): number };

function toNumber(n: DecimalLike): number {
  return typeof n === "number" ? n : n.toNumber();
}

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const idNum = new Intl.NumberFormat("id-ID");

/** Full Rupiah: "Rp100.000.000" */
export function formatIDR(n: DecimalLike): string {
  return idr.format(toNumber(n));
}

/** Compact Rupiah: "Rp100M", "Rp12,3M", "Rp3,4B" */
export function formatCompactIDR(n: DecimalLike): string {
  const v = toNumber(n);
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${sign}Rp${dec(abs / 1e9)}B`;
  if (abs >= 1_000_000) return `${sign}Rp${dec(abs / 1e6)}M`;
  if (abs >= 1_000) return `${sign}Rp${Math.round(abs / 1e3)}rb`;
  return `${sign}Rp${Math.round(abs)}`;
}

function dec(n: number): string {
  return n >= 100 ? Math.round(n).toString() : n.toFixed(1).replace(".", ",");
}

/** Full number: "1.234.567" */
export function formatNumber(n: DecimalLike): string {
  return idNum.format(Math.round(toNumber(n)));
}

/** Compact number: "12,3K", "1,2M", "1,2B" */
export function formatCompactNumber(n: DecimalLike): string {
  const v = toNumber(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${dec(abs / 1e9)}B`;
  if (abs >= 1_000_000) return `${sign}${dec(abs / 1e6)}M`;
  if (abs >= 1_000) return `${sign}${dec(abs / 1e3)}rb`;
  return `${sign}${Math.round(abs)}`;
}

/** Percentage: "4,2%" */
export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace(".", ",")}%`;
}

/** Signed delta: "+12%", "-5%", "0%" */
export function formatDelta(n: number): string {
  const v = n.toFixed(1).replace(".", ",");
  return n > 0 ? `+${v}%` : `${v}%`;
}

// Formatter cache — one Intl instance per (kind, timezone). Keeps hot render
// paths cheap without hardcoding any zone.
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function idFormatter(kind: string, opts: Intl.DateTimeFormatOptions, timeZone?: string): Intl.DateTimeFormat {
  const tz = normalizeTimezone(timeZone ?? DEFAULT_TIMEZONE);
  const key = `${kind}|${tz}`;
  let fmt = fmtCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: tz });
    fmtCache.set(key, fmt);
  }
  return fmt;
}

/** "17 Agu 2026" */
export function formatDate(d: Date, timeZone?: string): string {
  return idFormatter(
    "date",
    { day: "2-digit", month: "short", year: "numeric" },
    timeZone,
  ).format(d);
}

/** "17 Agu, 14:30" */
export function formatDateTime(d: Date, timeZone?: string): string {
  return idFormatter(
    "dateTime",
    { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
    timeZone,
  ).format(d);
}

/** Clock time "14:30" in the given timezone (parts joined manually so the
 * separator stays ":" regardless of ICU locale punctuation). */
export function formatTime(d: Date, timeZone?: string): string {
  const parts = idFormatter(
    "time",
    { hour: "2-digit", minute: "2-digit", hour12: false },
    timeZone,
  ).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("hour").padStart(2, "0").slice(-2)}:${get("minute")}`;
}

/** Relative time: "2j lalu", "5m lalu", "baru saja". Deltas are
 * timezone-independent; the >30-day fallback renders a tenant-local date. */
export function timeAgo(d: Date, timeZone?: string): string {
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}h lalu`;
  return formatDate(d, timeZone);
}

/** Day-of-week short: "Sen", "Sel" */
export function dayShort(d: Date, timeZone?: string): string {
  return idFormatter("weekday", { weekday: "short" }, timeZone).format(d);
}
