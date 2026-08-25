import { CheckCircle2 } from "lucide-react";

export function FeaturesSection() {
  const pillars = [
    {
      num: "01",
      tag: "Master Data",
      title: "Creator & Brand Directory",
      description:
        "Centralize your creator roster and client brand relationships. Track creator tier categories, health indicators (Healthy, Watch, AtRisk), platform handles, and dedicated talent managers in one directory.",
      specs: [
        "Creator health & status tracking",
        "Assigned manager accountability",
        "Client brand profiles & product catalogs",
        "Historical GMV contribution per creator",
      ],
    },
    {
      num: "02",
      tag: "Execution",
      title: "Campaigns & Content Pipeline",
      description:
        "Drive brand campaigns with end-to-end milestone tracking. Link creator rosters to campaign briefs, track GMV target pacing against live sales, and manage script reviews and video deliverables.",
      specs: [
        "Campaign GMV target vs actual tracking",
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
        "Host and operator shift assignments",
        "Live GMV target and actual fulfillment",
        "Agency timezone-synchronized calendar",
      ],
    },
    {
      num: "04",
      tag: "Financial Engine",
      title: "Automated Commissions & Settlements",
      description:
        "Eliminate spreadsheet commission math. Automatically compute creator commission splits from verified campaign and live GMVs, generate payout approval batches, and reconcile brand invoices.",
      specs: [
        "Multi-tier contract commission formulas",
        "Batch creator payout approval queues",
        "Brand settlement ledger and invoice tracking",
        "Full audit trail for agency accounting",
      ],
    },
  ];

  return (
    <section id="capabilities" className="border-b border-border/70 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            System Capabilities
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Engineered for high-velocity agency execution.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Four specialized modules working on the same underlying relational database.
          </p>
        </div>

        {/* 2-Column Editorial Grid */}
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col justify-between border-t border-border/80 pt-8"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-brand">
                    {pillar.num}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-6 border-t border-border/50 pt-4">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {pillar.specs.map((spec) => (
                    <li
                      key={spec}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
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
