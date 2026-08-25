import { Building2, Users, Radio, Wallet, CheckCircle2 } from "lucide-react";

export function UseCasesSection() {
  const audiences = [
    {
      icon: Building2,
      title: "TikTok Agencies",
      subtitle: "Agency Owners & Executives",
      description:
        "Designed for commerce agencies managing multiple creator rosters, dozens of client brands, and simultaneous live streaming operations from one executive cockpit.",
      benefits: [
        "Consolidated agency GMV & revenue view",
        "Multi-brand client campaign oversight",
        "Role-isolated workspaces with full auditability",
      ],
    },
    {
      icon: Users,
      title: "Creator Management Teams",
      subtitle: "Talent Managers & Agents",
      description:
        "For teams responsible for creator relationships, engagement tracking, campaign brief distribution, and content deliverable approvals.",
      benefits: [
        "Creator health & activity monitoring",
        "Content review & script approval stages",
        "Direct link between creators and campaign briefs",
      ],
    },
    {
      icon: Radio,
      title: "LIVE Commerce Teams",
      subtitle: "Studio Managers & Stream Operators",
      description:
        "For teams coordinating physical studio rooms, assigning live stream operators, scheduling creator shifts, and tracking live GMV pacing in real time.",
      benefits: [
        "Studio room reservation calendar",
        "Host & operator shift assignment",
        "Live GMV target fulfillment logs",
      ],
    },
    {
      icon: Wallet,
      title: "Operations & Finance",
      subtitle: "Finance Managers & Accountants",
      description:
        "For professionals responsible for calculating multi-tier creator commissions, disbursing batch payouts, and generating brand invoice settlements.",
      benefits: [
        "Automated commission split computations",
        "Batch creator payout approval queues",
        "Brand settlement reconciliation & invoicing",
      ],
    },
  ];

  return (
    <section id="use-cases" className="py-20 sm:py-28 bg-card border-b border-border/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Tailored Roles
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Who is Agency OS built for?
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Whether you run the agency, manage creator talent, operate live streams, or handle the
            books, Agency OS provides dedicated workflows.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((aud) => {
            const Icon = aud.icon;
            return (
              <div
                key={aud.title}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/50 p-6 shadow-xs transition-all hover:border-brand/40 hover:shadow-md"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-foreground">{aud.title}</h3>
                  <span className="text-[11px] font-medium text-brand">{aud.subtitle}</span>

                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    {aud.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
                  {aud.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
