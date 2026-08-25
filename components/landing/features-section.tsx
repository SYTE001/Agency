import {
  Users,
  Building2,
  Megaphone,
  FileText,
  Radio,
  CheckSquare,
  BarChart3,
  Wallet,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeaturesSection() {
  const features = [
    {
      icon: Users,
      title: "Creator Management",
      badge: "Master Data",
      description:
        "Manage creator profiles, platform handles, niche categories, manager assignments, and operational health status (Healthy, Watch, AtRisk).",
      tags: ["Health Tracking", "Manager Assignments", "Platform Roster"],
    },
    {
      icon: Building2,
      title: "Brand Management",
      badge: "Client Directory",
      description:
        "Centralize brand clients, primary contacts, product portfolios, linked campaigns, and brand settlement histories.",
      tags: ["Brand Directory", "Contact Rosters", "Settlement Ledger"],
    },
    {
      icon: Megaphone,
      title: "Campaign Management",
      badge: "Execution",
      description:
        "Track campaign operations, GMV targets vs actuals, assigned creator rosters, and delivery milestones from brief to completion.",
      tags: ["GMV Pacing", "Creator Linkage", "Status Milestones"],
    },
    {
      icon: FileText,
      title: "Content Management",
      badge: "Production Pipeline",
      description:
        "Organize campaign video deliverables, review stages, script approvals, revision notes, and publishing schedules.",
      tags: ["Review Stages", "Script Approvals", "Publishing Deadlines"],
    },
    {
      icon: Radio,
      title: "LIVE Commerce",
      badge: "Studio Ops",
      description:
        "Coordinate studio room allocations, host creator shifts, live operator assignments, target GMVs, and real-time live performance.",
      tags: ["Studio Rooms", "Shift Scheduling", "Operator Tracking"],
    },
    {
      icon: CheckSquare,
      title: "Task Management",
      badge: "Collaboration",
      description:
        "Coordinate team responsibilities, priority levels (Low, Medium, High, Critical), due dates, and direct links to creators and campaigns.",
      tags: ["Role-Based Tasks", "Priority Queues", "Linked Entities"],
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      badge: "Business Intelligence",
      description:
        "Turn operational and financial data into actionable insights with multi-dimensional breakdowns by creator, brand, and campaign.",
      tags: ["GMV Trends", "Performance Deltas", "Exportable Summaries"],
    },
    {
      icon: Wallet,
      title: "Finance & Settlements",
      badge: "Financial Engine",
      description:
        "Calculate tiered commissions, approve batch creator payouts, and reconcile brand invoice settlements with full audit trails.",
      tags: ["Commission Splits", "Batch Payouts", "Brand Settlements"],
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-card border-b border-border/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Core Modules
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your agency needs in one system.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Purpose-built tools for managing talent, executing brand campaigns, running live
            commerce studios, and handling agency finances.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:bg-card hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/50 flex flex-wrap gap-1.5">
                  {f.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                    >
                      {t}
                    </span>
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
