import { Settings, Users, BarChart3, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Settings,
      title: "Set up your agency",
      description:
        "Configure your agency workspace, default operational timezone (e.g. Asia/Jakarta), currency, and invite team members with specific RBAC roles (Admin, Manager, Operator, Finance, Viewer).",
      details: ["Agency profile & branding", "Role-based team permissions", "Tenant-isolated workspace"],
    },
    {
      step: "02",
      icon: Users,
      title: "Manage the operation",
      description:
        "Onboard your creators and brands, organize campaign pipelines, schedule live stream studio shifts, track content deliverables, and assign team tasks.",
      details: ["Creator & brand rosters", "Campaign & LIVE scheduling", "Real-time task assignments"],
    },
    {
      step: "03",
      icon: BarChart3,
      title: "Track performance and finance",
      description:
        "Review daily GMV trends, generate multi-dimensional analytics reports, compute creator commission splits automatically, and reconcile brand settlements.",
      details: ["Daily GMV pacing charts", "Automated commission splits", "Batch creator payouts"],
    },
  ];

  return (
    <section id="workflow" className="py-20 sm:py-28 bg-subtle/40 border-b border-border/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Operational Workflow
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How Agency OS works in practice.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            A straightforward 3-step operational cycle to transition your agency from chaos to
            structured efficiency.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-brand/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-brand">{s.step}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 space-y-1.5">
                  {s.details.map((d) => (
                    <div key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>{d}</span>
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
