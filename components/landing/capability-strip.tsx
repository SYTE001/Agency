import {
  Users,
  Building2,
  Megaphone,
  FileText,
  Radio,
  CheckSquare,
  BarChart3,
  Wallet,
} from "lucide-react";

export function CapabilityStrip() {
  const capabilities = [
    { icon: Users, label: "Creators", desc: "Rosters & Health" },
    { icon: Building2, label: "Brands", desc: "Clients & Contacts" },
    { icon: Megaphone, label: "Campaigns", desc: "Pacing & Targets" },
    { icon: FileText, label: "Content", desc: "Pipelines & Review" },
    { icon: Radio, label: "LIVE Commerce", desc: "Studios & Schedules" },
    { icon: CheckSquare, label: "Tasks", desc: "Team Execution" },
    { icon: BarChart3, label: "Reports", desc: "Analytics & Trends" },
    { icon: Wallet, label: "Finance", desc: "Payouts & Settlements" },
  ];

  return (
    <section className="border-y border-border/70 bg-card py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          One workspace for the entire agency operation
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.label}
                className="group flex flex-col items-center rounded-lg border border-border/60 bg-background/60 p-3.5 text-center transition-all hover:border-brand/50 hover:bg-accent/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="mt-2.5 text-xs font-semibold text-foreground">
                  {cap.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{cap.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
