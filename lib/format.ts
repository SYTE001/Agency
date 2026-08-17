// Formatting helpers. Indonesian (id-ID) conventions throughout.

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

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "17 Agu 2026" */
export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

/** "17 Agu, 14:30" */
export function formatDateTime(d: Date): string {
  return dateTimeFmt.format(d);
}

/** Relative time: "2j lalu", "5m lalu", "baru saja" */
export function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}h lalu`;
  return formatDate(d);
}

/** Day-of-week short: "Sen", "Sel" */
export function dayShort(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(d);
}
