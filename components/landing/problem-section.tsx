import { CheckCircle2, Workflow } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      title: "Creators tracked in disconnected spreadsheets",
      desc: "Outdated follower counts, unmanaged handles, and buried rate cards lead to lost talent opportunities.",
    },
    {
      title: "Campaign briefs lost in group chats",
      desc: "Deliverable reviews, revision rounds, and feedback get scattered across WhatsApp and Telegram threads.",
    },
    {
      title: "LIVE studio shifts difficult to coordinate",
      desc: "Double-booked rooms, unassigned stream operators, and host conflicts create missed broadcast windows.",
    },
    {
      title: "Manual creator commission calculations",
      desc: "Hours spent crunching multi-tier percentage splits and chasing unbilled brand invoices.",
    },
  ];

  return (
    <section id="problem" className="border-b border-border/70 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            The Operational Bottleneck
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Agency operations get messy fast.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            As your roster expands and campaign volume climbs, disconnected tools create communication silos, billing delays, and operational blind spots.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Fragmented Reality */}
          <div className="lg:col-span-6 space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1">
              Before Agency OS: Fragmented Tools
            </div>
            {problems.map((p, idx) => (
              <div
                key={p.title}
                className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-4 transition-colors hover:border-border"
              >
                <span className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
                  0{idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Centralized Solution */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-brand/40 bg-card p-6 sm:p-8 shadow-sm">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                <Workflow className="h-3.5 w-3.5" />
                <span>The Unified System</span>
              </div>

              <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                One relational backbone for your entire agency team.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                All data points are bound directly to your agency workspace. Changes to campaigns, live shifts, and creator deliverables synchronize in real time.
              </p>

              <div className="mt-6 space-y-2.5 rounded-lg border border-border/70 bg-subtle p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Synchronized Core Modules
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 rounded border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Verified Creator Directory</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Campaign GMV Pacing</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Studio Room Shift Roster</span>
                  </div>
                  <div className="flex items-center gap-2 rounded border border-border/60 bg-card p-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                    <span className="font-medium text-foreground">Auto-Calculated Payouts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
