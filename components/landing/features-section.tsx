import { CheckCircle2 } from "lucide-react";

export function FeaturesSection() {
  const pillars = [
    {
      num: "01",
      tag: "Master Data",
      title: "Creator & Brand Directory",
      description:
        "Centralize your creator roster and client brand relationships. Track creator tier categories, health indicators, platform handles, and dedicated talent managers in one directory.",
      specs: [
        "Creator health & tier classification",
        "Assigned talent manager ownership",
        "Brand profiles & product catalogs",
        "Historical GMV contribution per creator",
      ],
    },
    {
      num: "02",
      tag: "Execution",
      title: "Campaign & Content Pipeline",
      description:
        "Drive brand campaigns with end-to-end milestone tracking. Link creator rosters to campaign briefs, track GMV target pacing against live sales, and manage script reviews and video deliverables.",
      specs: [
        "Campaign GMV target vs actual pacing",
        "Multi-creator assignment and briefing",
        "Script approval and revision workflows",
        "Publishing deadlines & deliverable status",
      ],
    },
    {
      num: "03",
      tag: "Studio Ops",
      title: "LIVE Commerce Scheduling",
      description:
        "Coordinate your physical studio rooms, schedule host creator shifts, assign stream operators, and track session GMV fulfillment in real time across the agency.",
      specs: [
        "Studio room reservation and availability",
        "Host creator and stream operator shifts",
        "Live GMV target and actual fulfillment",
        "Agency timezone-synchronized calendar",
      ],
    },
    {
      num: "04",
      tag: "Financial Engine",
      title: "Automated Commissions & Settlements",
      description:
        "Eliminate manual spreadsheet commission calculations. Automatically compute creator commission splits from verified campaign and live GMVs, generate payout approval batches, and reconcile brand invoices.",
      specs: [
        "Multi-tier contract commission formulas",
        "Batch creator payout approval queues",
        "Brand settlement ledger & invoice tracking",
        "Full audit trail for agency accounting",
      ],
    },
  ];

  return (
    <section id="capabilities" className="border-t border-[#e2ded6] dark:border-[#2f2e2a] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#706e66] dark:text-[#9e9c94]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a1f]" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111111] dark:text-[#f5f4f0] sm:text-4xl lg:text-5xl">
            Engineered for high-velocity agency execution.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
            Four core modules connected to the same underlying database, eliminating fragmented spreadsheets and disjointed handoffs.
          </p>
        </div>

        {/* 2-Column Swiss Editorial Grid with Hairline Dividers */}
        <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-16">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col justify-between border-t border-[#e2ded6] dark:border-[#2f2e2a] pt-8"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#111111] dark:text-[#f5f4f0]">
                    {pillar.num}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#706e66] dark:text-[#9e9c94]">
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold tracking-tight text-[#111111] dark:text-[#f5f4f0] sm:text-2xl">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-8 border-t border-[#eae6de] dark:border-[#262522] pt-4">
                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {pillar.specs.map((spec) => (
                    <li
                      key={spec}
                      className="flex items-start gap-2 text-xs text-[#5a5852] dark:text-[#9e9c94]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#ff5a1f] shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
