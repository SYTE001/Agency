import { CheckCircle2 } from "lucide-react";

export function UseCases() {
  const roles = [
    {
      title: "Agency Owners & Executives",
      role: "Executive Cockpit",
      description:
        "Consolidated agency GMV pacing, net revenue metrics, client brand health, and team productivity in real time.",
      points: [
        "Executive 30-day GMV pacing overview",
        "Multi-brand campaign oversight",
        "Tenant-isolated agency workspace",
      ],
    },
    {
      title: "Talent & Creator Managers",
      role: "Talent Operations",
      description:
        "Dedicated creator directories, roster health monitoring, manager assignment, and content review workflows.",
      points: [
        "Creator health (Healthy, Watch, AtRisk)",
        "Script approval and revision stages",
        "Direct link to campaign deliverables",
      ],
    },
    {
      title: "LIVE Studio & Stream Teams",
      role: "Studio Operations",
      description:
        "Physical studio room reservations, host talent shifts, operator assignments, and live target GMV tracking.",
      points: [
        "Studio room reservation calendar",
        "Host and operator shift schedules",
        "Live GMV fulfillment tracking",
      ],
    },
    {
      title: "Operations & Finance Teams",
      role: "Financial Precision",
      description:
        "Automated commission calculations, batch payout approval queues, and client brand settlement invoice tracking.",
      points: [
        "Multi-tier contract commission formulas",
        "Batch creator payout approval queues",
        "Brand settlement invoice reconciliation",
      ],
    },
  ];

  return (
    <section id="use-cases" className="border-b border-border/70 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tailored Roles
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Who is Agency OS built for?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Purpose-built workflows for leadership, talent agents, studio crew, and finance specialists.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <div
              key={r.title}
              className="flex flex-col justify-between border-t border-border/80 pt-8"
            >
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
                  {r.role}
                </span>

                <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">
                  {r.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {r.description}
                </p>
              </div>

              <div className="mt-6 border-t border-border/50 pt-4 space-y-2">
                {r.points.map((p) => (
                  <div
                    key={p}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
