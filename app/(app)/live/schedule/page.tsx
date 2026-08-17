import Link from "next/link";
import { Radio } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { listLiveSessions } from "@/lib/services/live";
import { PageHeader } from "@/components/page-header";
import { ScheduleCalendar } from "@/components/live/schedule-calendar";
import { cn } from "@/lib/utils";

const VIEWS = [
  { key: "day", label: "Hari" },
  { key: "week", label: "Minggu" },
  { key: "month", label: "Bulan" },
] as const;

type View = (typeof VIEWS)[number]["key"];

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function LiveSchedulePage(props: PageProps<"/live/schedule">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const viewParam = str(searchParams.view);
  const view: View = VIEWS.some((v) => v.key === viewParam) ? (viewParam as View) : "week";

  // Anchor date from ?date=YYYY-MM-DD, clamped to a valid date
  let anchor = new Date();
  const dateParam = str(searchParams.date);
  if (dateParam) {
    const d = new Date(`${dateParam}T00:00:00`);
    if (!Number.isNaN(d.getTime())) anchor = d;
  }

  // Fetch window that always covers the current view (day / week / month grid)
  const windowStart = (() => {
    if (view === "month") {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const s = new Date(first);
      s.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // Monday of grid
      return s;
    }
    if (view === "week") {
      const s = new Date(anchor);
      s.setHours(0, 0, 0, 0);
      s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
      return s;
    }
    const s = new Date(anchor);
    s.setHours(0, 0, 0, 0);
    return s;
  })();
  const windowEnd = (() => {
    const days = view === "month" ? 42 : view === "week" ? 7 : 1;
    const e = new Date(windowStart);
    e.setDate(e.getDate() + days);
    return e;
  })();
  const result = await listLiveSessions(user.agencyId, {
    rangeStart: windowStart,
    rangeEnd: windowEnd,
  });
  const canWrite = can(user.role as Role, "live", "write");

  const dateKey = (d: Date) => d.toISOString().slice(0, 10);
  const shift = (days: number) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + days);
    return `/live/schedule?view=${view}&date=${dateKey(d)}`;
  };
  const shiftMonth = (dir: 1 | -1) => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
    return `/live/schedule?view=${view}&date=${dateKey(d)}`;
  };

  const prevHref = view === "day" ? shift(-1) : view === "week" ? shift(-7) : shiftMonth(-1);
  const nextHref = view === "day" ? shift(1) : view === "week" ? shift(7) : shiftMonth(1);
  const todayHref = `/live/schedule?view=${view}`;

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Jadwal LIVE"
        description="Kalender operasional sesi LIVE — tampilan hari, minggu, dan bulan"
      >
        {canWrite ? (
          <Link
            href="/live/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
          >
            Jadwalkan LIVE
          </Link>
        ) : null}
      </PageHeader>

      {/* View switcher */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/live"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-card px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Radio className="h-4 w-4" />
          Dashboard LIVE
        </Link>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`/live/schedule?view=${v.key}&date=${dateKey(anchor)}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      <ScheduleCalendar
        sessions={result.sessions}
        view={view}
        anchor={anchor}
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={todayHref}
      />
    </div>
  );
}
