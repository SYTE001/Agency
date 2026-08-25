import {
  FileSpreadsheet,
  MessageSquare,
  Clock,
  Calculator,
  Layers,
  CheckCircle2,
  ArrowRight,
  Database,
  Shield,
  Workflow,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProblemSection() {
  const problems = [
    {
      icon: FileSpreadsheet,
      title: "Creators tracked in spreadsheets",
      desc: "Outdated follower metrics, scattered contact info, and chaotic rate cards make scaling creator rosters unmanageable.",
    },
    {
      icon: MessageSquare,
      title: "Campaigns scattered across chats",
      desc: "Creative briefs, video deliverables, and revision rounds get lost in endless WhatsApp and Telegram group chats.",
    },
    {
      icon: Clock,
      title: "LIVE schedules are hard to coordinate",
      desc: "Host double-booking, empty studio slots, and unassigned live stream operators lead to missed GMV opportunities.",
    },
    {
      icon: Calculator,
      title: "Finance and payouts require manual calculations",
      desc: "Hours wasted manually calculating multi-tier creator commission splits and chasing unbilled brand settlements.",
    },
    {
      icon: Layers,
      title: "Important information lives in different tools",
      desc: "Disconnected documents and apps create blind spots, operational delays, and misaligned team members.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-subtle/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive dark:text-red-400">
            The Operational Bottleneck
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Agency operations get messy fast.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            As your agency signs more creators and executes more brand campaigns, scattered tools
            create communication silos, missed deadlines, and calculation errors.
          </p>
        </div>

        {/* Split comparison layout */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Fragmented Problems */}
          <div className="lg:col-span-6 space-y-3">
            {problems.map((prob, idx) => {
              const Icon = prob.icon;
              return (
                <div
                  key={prob.title}
                  className="flex items-start gap-3.5 rounded-lg border border-border/80 bg-card p-4 shadow-xs transition-colors hover:border-destructive/40"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{prob.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {prob.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Centralized Solution Card */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl border-2 border-brand/30 bg-card p-6 sm:p-8 shadow-xl overflow-hidden">
              {/* Subtle top badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                <Workflow className="h-3.5 w-3.5" />
                <span>The Unified Solution</span>
              </div>

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                Agency OS brings the operation into one system.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Replace fragmented spreadsheets and disconnected chat apps with a single,
                role-authenticated operating platform engineered specifically for creator commerce.
              </p>

              {/* Connected Solution Architecture Map */}
              <div className="mt-6 space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Central Relational Data Hub
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Single Creator Roster</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Campaign GMV Pacing</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Studio LIVE Scheduler</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Automated Commissions</span>
                  </div>
                </div>

                <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    ✓ All changes reflect in real time across managers, operators, and finance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
