import Link from "next/link";
import { Radio } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { getAgencyTimezone } from "@/lib/services/common";
import { listLiveSessions } from "@/lib/services/live";
import {
  dateKeyInTz,
  daysAgoStartInTz,
  dayStartInTz,
  monthStartInTz,
  parseDateKeyInTz,
  shiftDateKey,
  startOfWeekInTz,
} from "@/lib/timezone";
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
  // The whole calendar lives in the tenant's business timezone: anchors,
  // fetch windows and URL keys are tenant-local calendar days, never the
  // server's runtime timezone.
  const tz = await getAgencyTimezone(user.agencyId);

  const viewParam = str(searchParams.view);
  const view: View = VIEWS.some((v) => v.key === viewParam) ? (viewParam as View) : "week";

  // Anchor date from ?date=YYYY-MM-DD interpreted in the tenant timezone;
  // invalid/missing keys fall back to the tenant's today.
  const dateParam = str(searchParams.date);
  const parsedAnchor = dateParam ? parseDateKeyInTz(tz, dateParam) : null;
  const anchor = parsedAnchor ?? new Date();
  const anchorKey = dateKeyInTz(tz, anchor);

  // Fetch window that always covers the current view (day / week / month grid),
  // computed as tenant-local midnights so it stays exact across DST changes.
  const windowStart =
    view === "month"
      ? startOfWeekInTz(tz, monthStartInTz(tz, anchor))
      : view === "week"
        ? startOfWeekInTz(tz, anchor)
        : dayStartInTz(tz, anchor);
  const gridDays = view === "month" ? 42 : view === "week" ? 7 : 1;
  const windowEnd = daysAgoStartInTz(tz, -gridDays, windowStart);

  const result = await listLiveSessions(user.agencyId, {
    rangeStart: windowStart,
    rangeEnd: windowEnd,
  });
  const canWrite = can(user.role, "live", "write");

  const shiftHref = (delta: { days?: number; months?: number }) => {
    const key = shiftDateKey(anchorKey, delta) ?? anchorKey;
    return `/live/schedule?view=${view}&date=${key}`;
  };
  const prevHref =
    view === "day" ? shiftHref({ days: -1 }) : view === "week" ? shiftHref({ days: -7 }) : shiftHref({ months: -1 });
  const nextHref =
    view === "day" ? shiftHref({ days: 1 }) : view === "week" ? shiftHref({ days: 7 }) : shiftHref({ months: 1 });
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
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
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
              href={`/live/schedule?view=${v.key}&date=${anchorKey}`}
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
        timeZone={tz}
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={todayHref}
      />
    </div>
  );
}
