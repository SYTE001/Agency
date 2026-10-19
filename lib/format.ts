import { DEFAULT_TIMEZONE, normalizeTimezone } from "@/lib/timezone";

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

export function formatIDR(n: DecimalLike): string {
  return idr.format(toNumber(n));
}

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

export function formatNumber(n: DecimalLike): string {
  return idNum.format(Math.round(toNumber(n)));
}

export function formatCompactNumber(n: DecimalLike): string {
  const v = toNumber(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${dec(abs / 1e9)}B`;
  if (abs >= 1_000_000) return `${sign}${dec(abs / 1e6)}M`;
  if (abs >= 1_000) return `${sign}${dec(abs / 1e3)}rb`;
  return `${sign}${Math.round(abs)}`;
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace(".", ",")}%`;
}

export function formatDelta(n: number): string {
  const v = n.toFixed(1).replace(".", ",");
  return n > 0 ? `+${v}%` : `${v}%`;
}

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

export function formatDate(d: Date, timeZone?: string): string {
  return idFormatter(
    "date",
    { day: "2-digit", month: "short", year: "numeric" },
    timeZone,
  ).format(d);
}

export function formatDateTime(d: Date, timeZone?: string): string {
  return idFormatter(
    "dateTime",
    { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" },
    timeZone,
  ).format(d);
}

export function formatTime(d: Date, timeZone?: string): string {
  const parts = idFormatter(
    "time",
    { hour: "2-digit", minute: "2-digit", hour12: false },
    timeZone,
  ).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("hour").padStart(2, "0").slice(-2)}:${get("minute")}`;
}

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

export function dayShort(d: Date, timeZone?: string): string {
  return idFormatter("weekday", { weekday: "short" }, timeZone).format(d);
}

