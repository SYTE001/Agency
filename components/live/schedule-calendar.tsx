import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LiveRow } from "@/lib/services/live";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  Scheduled: "bg-brand",
  Preparing: "bg-warning",
  Live: "bg-destructive animate-pulse",
  Ended: "bg-muted-foreground/40",
  Cancelled: "bg-muted-foreground/25",
  NeedsReview: "bg-warning",
};

function keyOf(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function timeHM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function mondayOf(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const monthLabelFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const weekdayShort = new Intl.DateTimeFormat("id-ID", { weekday: "short" });

/**
 * Operational LIVE calendar (PLAN §11) — day / week / month views.
 * Purely server-rendered; navigation is plain links (?date / ?week / ?month).
 */
export function ScheduleCalendar({
  sessions,
  view,
  anchor,
  prevHref,
  nextHref,
  todayHref,
}: {
  sessions: LiveRow[];
  view: "day" | "week" | "month";
  anchor: Date;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const byDay = new Map<string, LiveRow[]>();
  for (const s of sessions) {
    const k = keyOf(s.startTime);
    const arr = byDay.get(k);
    if (arr) arr.push(s);
    else byDay.set(k, [s]);
  }
  for (const arr of byDay.values()) arr.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const today = new Date();

  const label =
    view === "day"
      ? formatDate(anchor)
      : view === "week"
        ? (() => {
            const monday = mondayOf(anchor);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return `${formatDate(monday)} – ${formatDate(sunday)}`;
          })()
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
        <DayColumn day={anchor} items={byDay.get(keyOf(anchor)) ?? []} />
      ) : view === "week" ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div className="grid min-w-[760px] grid-cols-7 divide-x">
            {Array.from({ length: 7 }).map((_, i) => {
              const monday = mondayOf(anchor);
              const day = new Date(monday);
              day.setDate(monday.getDate() + i);
              const isToday = keyOf(day) === keyOf(today);
              return (
                <div key={i} className="min-h-72">
                  <div
                    className={cn(
                      "sticky top-0 border-b bg-card px-2 py-1.5 text-center text-xs font-medium",
                      isToday ? "text-brand" : "text-muted-foreground",
                    )}
                  >
                    {weekdayShort.format(day)} {day.getDate()}
                  </div>
                  <div className="space-y-1 p-1.5">
                    {(byDay.get(keyOf(day)) ?? []).map((s) => (
                      <SessionChip key={s.id} s={s} />
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
            {Array.from({ length: 7 }).map((_, i) => {
              const monday = mondayOf(anchor);
              const day = new Date(monday);
              day.setDate(monday.getDate() + i);
              return (
                <div key={i} className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  {weekdayShort.format(day)}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7">
            {(() => {
              const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
              const start = mondayOf(first);
              return Array.from({ length: 42 }).map((_, i) => {
                const day = new Date(start);
                day.setDate(start.getDate() + i);
                const inMonth = day.getMonth() === anchor.getMonth();
                const isToday = keyOf(day) === keyOf(today);
                const items = byDay.get(keyOf(day)) ?? [];
                return (
                  <div
                    key={i}
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
                        {day.getDate()}
                      </span>
                    </p>
                    {items.slice(0, 3).map((s) => (
                      <SessionChip key={s.id} s={s} />
                    ))}
                    {items.length > 3 ? (
                      <p className="px-1 text-[10px] text-muted-foreground">+{items.length - 3} lagi</p>
                    ) : null}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function DayColumn({ day, items }: { day: Date; items: LiveRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Tidak ada sesi LIVE pada {formatDate(day)}.
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
            {timeHM(s.startTime)}
            {s.endTime ? <span className="text-xs font-normal text-muted-foreground"> – {timeHM(s.endTime)}</span> : null}
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

function SessionChip({ s }: { s: LiveRow }) {
  return (
    <Link
      href={`/live/${s.id}`}
      title={`${s.creatorName} · ${s.room ?? ""}`}
      className="block rounded border bg-card px-1.5 py-1 text-xs leading-tight transition-colors hover:bg-accent"
    >
      <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle", STATUS_DOT[s.status] ?? "bg-muted-foreground/40")} />
      <span className="font-medium">{timeHM(s.startTime)}</span>{" "}
      <span className="text-muted-foreground">{s.creatorName}</span>
    </Link>
  );
}
