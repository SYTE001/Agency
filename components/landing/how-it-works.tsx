import { CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Set up your workspace",
      description:
        "Name your agency, set operational timezone (WIB/WITA/WIT) and default currency, invite your team, and configure role-based permissions.",
      specs: [
        "Agency profile & timezone alignment",
        "8-tier RBAC role assignment",
        "Tenant-isolated relational database",
      ],
    },
    {
      step: "02",
      title: "Execute daily operations",
      description:
        "Onboard creator rosters and brand catalogs, link creators to campaign briefs, allocate physical studio rooms, and assign stream operators.",
      specs: [
        "Creator health & talent manager linkage",
        "Physical studio room & shift booking",
        "Content deliverables & review stages",
      ],
    },
    {
      step: "03",
      title: "Close and settle numbers",
      description:
        "Commissions compute automatically from recorded campaign and LIVE GMVs. Payout batches queue for approval and brand invoice settlements reconcile.",
      specs: [
        "Prisma Decimal precision calculations",
        "Batch creator payout approval queues",
        "Brand settlement invoice ledger",
      ],
    },
  ];

  return (
    <section id="workflow" className="border-t border-[#e2ded6] dark:border-[#2f2e2a] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#706e66] dark:text-[#9e9c94]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a1f]" />
            <span>Operational Workflow</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111111] dark:text-[#f5f4f0] sm:text-4xl lg:text-5xl">
            Three steps, then it repeats.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
            A predictable operational cadence that connects talent managers, studio teams, and finance in one synchronized loop.
          </p>
        </div>

        {/* 3-Column Swiss Numbered Flow */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex flex-col justify-between border-t border-[#e2ded6] dark:border-[#2f2e2a] pt-8"
            >
              <div>
                <span className="font-mono text-sm font-bold text-[#111111] dark:text-[#f5f4f0]">
                  {s.step}
                </span>

                <h3 className="mt-5 text-xl font-bold tracking-tight text-[#111111] dark:text-[#f5f4f0]">
                  {s.title}
                </h3>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
                  {s.description}
                </p>
              </div>

              <div className="mt-8 border-t border-[#eae6de] dark:border-[#262522] pt-4 space-y-2.5">
                {s.specs.map((spec) => (
                  <div
                    key={spec}
                    className="flex items-center gap-2 text-xs text-[#5a5852] dark:text-[#9e9c94]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#ff5a1f] shrink-0" />
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
