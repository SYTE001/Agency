import { CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Set up your workspace",
      description:
        "Name the agency, select the operational timezone (WIB/WITA/WIT) and default currency, then invite your team and assign role-based permissions.",
      specs: [
        "Agency profile & timezone setting",
        "Role assignment (Owner to Viewer)",
        "Tenant-isolated database workspace",
      ],
    },
    {
      step: "02",
      title: "Execute daily operations",
      description:
        "Onboard creator rosters and brand catalogs, link creators to campaign briefs, allocate physical studio rooms, and assign stream operators.",
      specs: [
        "Creator health & manager linkage",
        "Studio room & shift scheduling",
        "Content deliverables & review stages",
      ],
    },
    {
      step: "03",
      title: "Close and settle the numbers",
      description:
        "Commissions compute automatically from recorded campaign and LIVE GMVs. Payout batches queue for approval and brand invoice settlements reconcile.",
      specs: [
        "Prisma Decimal precision math",
        "Batch creator payout approval",
        "Brand settlement invoice status",
      ],
    },
  ];

  return (
    <section id="workflow" className="border-b border-border/70 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Operational Workflow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Three steps, then it repeats.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A clean operating rhythm that replaces chaos with predictable execution across every department.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex flex-col justify-between border-t border-border/80 pt-8"
            >
              <div>
                <span className="font-mono text-sm font-semibold text-brand">
                  {s.step}
                </span>

                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {s.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {s.description}
                </p>
              </div>

              <div className="mt-6 border-t border-border/50 pt-4 space-y-2">
                {s.specs.map((spec) => (
                  <div
                    key={spec}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                    <span>{spec}</span>
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
