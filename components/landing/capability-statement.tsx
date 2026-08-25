import { Database, Shield, Globe, Clock } from "lucide-react";

export function CapabilityStatement() {
  const specs = [
    {
      label: "Access Model",
      value: "Invite-only, per agency",
      detail: "Created and managed by agency Owner/Admin.",
      icon: Shield,
    },
    {
      label: "Tenant Isolation",
      value: "Strict agencyId binding",
      detail: "Zero cross-tenant data leakage at database level.",
      icon: Database,
    },
    {
      label: "Time & Localization",
      value: "WIB / WITA / WIT Timezones",
      detail: "All shifts, live logs, and GMV pacing match agency local time.",
      icon: Clock,
    },
    {
      label: "Data Integrity",
      value: "PostgreSQL & Prisma Engine",
      detail: "Decimal financial precision with relational cascade controls.",
      icon: Globe,
    },
  ];

  return (
    <section className="border-y border-border/70 bg-subtle/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              One central cockpit for talent, brands, and revenue.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Replace a fragile maze of separate spreadsheets, WhatsApp groups, and manual payout slips with an engineered operating system.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {specs.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex flex-col justify-between rounded-lg border border-border/70 bg-card p-4 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 text-brand" />
                        <span>{item.label}</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-foreground">
                        {item.value}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
