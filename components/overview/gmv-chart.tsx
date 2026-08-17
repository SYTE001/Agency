import { dayShort, formatCompactIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

// Pure server-side SVG bar chart (no client JS). Renders GMV per day over the
// last 30 days. Labels are shown every ~7 bars to stay readable.
export function GmvChart({ data }: { data: { date: Date; gmv: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada data GMV 30 hari terakhir
      </p>
    );
  }

  const W = 900;
  const H = 200;
  const PAD_BOTTOM = 22;
  const max = Math.max(...data.map((d) => d.gmv));
  const chartH = H - PAD_BOTTOM;
  const n = data.length;
  const gap = 3;
  const bw = Math.max(2, (W - gap * (n - 1)) / n);
  const step = Math.max(1, Math.ceil(n / 8)); // ~8 date labels

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-48 w-full min-w-[560px]"
        preserveAspectRatio="none"
        role="img"
        aria-label="Grafik GMV harian 30 hari terakhir"
      >
        {data.map((d, i) => {
          const h = max > 0 ? Math.max(2, (d.gmv / max) * (chartH - 4)) : 2;
          const x = i * (bw + gap);
          const y = chartH - h;
          return (
            <g key={d.date.getTime()}>
              <rect x={x} y={y} width={bw} height={h} rx={1.5} className="fill-brand/80">
                <title>{`${dayShort(d.date)} ${d.date.getDate()}: ${formatCompactIDR(d.gmv)}`}</title>
              </rect>
              {i % step === 0 ? (
                <text
                  x={x + bw / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={11}
                  className="fill-muted-foreground"
                >
                  {d.date.getDate()} {dayShort(d.date)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Sparkline-style bar for KPI cards (compact, decorative)
export function Sparkline({ data, className }: { data: { date: Date; gmv: number }[]; className?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.gmv));
  return (
    <div className={cn("flex h-8 items-end gap-[2px]", className)} aria-hidden>
      {data.map((d, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm bg-brand/60"
          style={{ height: max > 0 ? `${Math.max(8, (d.gmv / max) * 100)}%` : "8%" }}
        />
      ))}
    </div>
  );
}
