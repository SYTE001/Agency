import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LiveRow } from "@/lib/services/live";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatTime } from "@/lib/format";
import {
  DEFAULT_TIMEZONE,
  dateKeyInTz,
  monthStartInTz,
  normalizeTimezone,
  parseDateKeyInTz,
  shiftDateKey,
  startOfWeekInTz,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  Scheduled: "bg-brand",
  Preparing: "bg-warning",
  Live: "bg-destructive animate-pulse",
  Ended: "bg-muted-foreground/40",
  Cancelled: "bg-muted-foreground/25",
  NeedsReview: "bg-warning",
};

// All calendar placement (day keys, week/month grids, "today" highlight, HH:MM
// chips) is computed in the tenant timezone passed by the page — never the
// server's runtime timezone. Grids iterate over "YYYY-MM-DD" keys (pure
// calendar math) so DST transitions cannot shift a day into the wrong column.

/**
 * Operational LIVE calendar (PLAN §11) — day / week / month views.
 * Purely server-rendered; navigation is plain links (?date / ?week / ?month).
 */
export function ScheduleCalendar({
  sessions,
  view,
  anchor,
  timeZone,
  prevHref,
  nextHref,
  todayHref,
}: {
  sessions: LiveRow[];
  view: "day" | "week" | "month";
  anchor: Date;
  timeZone?: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const tz = normalizeTimezone(timeZone ?? DEFAULT_TIMEZONE);
  const keyOf = (d: Date) => dateKeyInTz(tz, d);

  const byDay = new Map<string, LiveRow[]>();
  for (const s of sessions) {
    const k = keyOf(s.startTime);
    const arr = byDay.get(k);
    if (arr) arr.push(s);
    else byDay.set(k, [s]);
  }
  for (const arr of byDay.values()) arr.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const today = new Date();
  const todayKey = keyOf(today);
  const anchorKey = keyOf(anchor);
  const anchorMonth = anchorKey.slice(0, 7); // "YYYY-MM" for in-month checks

  const monthLabelFmt = new Intl.DateTimeFormat("id-ID", { timeZone: tz, month: "long", year: "numeric" });
  const weekdayShort = new Intl.DateTimeFormat("id-ID", { timeZone: tz, weekday: "short" });

  // The 7/42 tenant-local calendar keys of the grid, starting at the week's Monday.
  const gridStartKey =
    view === "month"
      ? keyOf(startOfWeekInTz(tz, monthStartInTz(tz, anchor)))
      : keyOf(startOfWeekInTz(tz, anchor));
  const gridKeys = Array.from({ length: view === "month" ? 42 : 7 }, (_, i) => shiftDateKey(gridStartKey, { days: i })!);
  // Midnight instant of a grid key — exact local midnight, safe for weekday labels.
  const keyDate = (key: string) => parseDateKeyInTz(tz, key) ?? anchor;

  const label =
    view === "day"
      ? formatDate(anchor, tz)
      : view === "week"
        ? `${formatDate(keyDate(gridKeys[0]), tz)} – ${formatDate(keyDate(gridKeys[6]), tz)}`
        : monthLabelFmt.format(anchor);

  return (
    <div className="space-y-3">
      {/* Nav */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={prevHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card transition-colors hover:bg-accent"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={todayHref}
            className="inline-flex h-8 items-center justify-center rounded-md border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Hari ini
          </Link>
          <Link
            href={nextHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card transition-colors hover:bg-accent"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-sm font-semibold capitalize">{label}</p>
      </div>

      {view === "day" ? (
        <DayColumn day={anchor} timeZone={tz} items={byDay.get(anchorKey) ?? []} />
      ) : view === "week" ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div className="grid min-w-[760px] grid-cols-7 divide-x">
            {gridKeys.slice(0, 7).map((key) => {
              const day = keyDate(key);
              const isToday = key === todayKey;
              return (
                <div key={key} className="min-h-72">
                  <div
                    className={cn(
                      "sticky top-0 border-b bg-card px-2 py-1.5 text-center text-xs font-medium",
                      isToday ? "text-brand" : "text-muted-foreground",
                    )}
                  >
                    {weekdayShort.format(day)} {Number(key.slice(8, 10))}
                  </div>
                  <div className="space-y-1 p-1.5">
                    {(byDay.get(key) ?? []).map((s) => (
                      <SessionChip key={s.id} s={s} timeZone={tz} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div className="grid min-w-[760px] grid-cols-7 divide-x border-b">
            {gridKeys.slice(0, 7).map((key) => (
              <div key={key} className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                {weekdayShort.format(keyDate(key))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridKeys.map((key) => {
              const inMonth = key.slice(0, 7) === anchorMonth;
              const isToday = key === todayKey;
              const items = byDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 space-y-1 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0",
                    !inMonth && "bg-muted/20",
                  )}
                >
                  <p className="text-right">
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center text-xs",
                        isToday
                          ? "rounded-full bg-brand font-semibold text-brand-foreground"
                          : inMonth
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50",
                      )}
                    >
                      {Number(key.slice(8, 10))}
                    </span>
                  </p>
                  {items.slice(0, 3).map((s) => (
                    <SessionChip key={s.id} s={s} timeZone={tz} />
                  ))}
                  {items.length > 3 ? (
                    <p className="px-1 text-[10px] text-muted-foreground">+{items.length - 3} lagi</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DayColumn({ day, timeZone, items }: { day: Date; timeZone: string; items: LiveRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Tidak ada sesi LIVE pada {formatDate(day, timeZone)}.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((s) => (
        <Link
          key={s.id}
          href={`/live/${s.id}`}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent"
        >
          <span className="w-24 shrink-0 text-sm font-semibold">
            {formatTime(s.startTime, timeZone)}
            {s.endTime ? (
              <span className="text-xs font-normal text-muted-foreground"> – {formatTime(s.endTime, timeZone)}</span>
            ) : null}
          </span>
          <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[s.status] ?? "bg-muted-foreground/40")} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{s.creatorName}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {s.room ?? "Room belum ditentukan"}
              {s.campaignName ? ` · ${s.campaignName}` : ""}
              {s.operatorName ? ` · operator ${s.operatorName}` : ""}
            </span>
          </span>
          <StatusBadge status={s.status} />
        </Link>
      ))}
    </div>
  );
}

function SessionChip({ s, timeZone }: { s: LiveRow; timeZone: string }) {
  return (
    <Link
      href={`/live/${s.id}`}
      title={`${s.creatorName} · ${s.room ?? ""}`}
      className="block rounded border bg-card px-1.5 py-1 text-xs leading-tight transition-colors hover:bg-accent"
    >
      <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle", STATUS_DOT[s.status] ?? "bg-muted-foreground/40")} />
      <span className="font-medium">{formatTime(s.startTime, timeZone)}</span>{" "}
      <span className="text-muted-foreground">{s.creatorName}</span>
    </Link>
  );
}
