"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  status: string;
  brand: { name: string };
  gmvTarget: number | { toNumber(): number };
  actualGmv: number | { toNumber(): number };
};

function amount(value: Project["gmvTarget"]): number {
  return typeof value === "number" ? value : value.toNumber();
}

function statusLabel(status: string) {
  if (status === "ContentReview") return "In review";
  if (status === "Recruiting") return "Recruiting";
  if (status === "Published") return "Published";
  return "Active";
}

function statusTone(status: string) {
  if (status === "ContentReview") return "bg-amber-500";
  if (status === "Published") return "bg-emerald-500";
  return "bg-foreground";
}

export function ActiveProjects({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <>
      <div className="overflow-hidden rounded-3xl border bg-card p-2 shadow-sm">
        {projects.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Belum ada campaign aktif.</p>
        ) : (
          <ul className="divide-y divide-border">
            {projects.map((project) => {
              const target = amount(project.gmvTarget);
              const actual = amount(project.actualGmv);
              const progress = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(project)}
                    className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-4 text-left transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[auto_minmax(180px,1.3fr)_minmax(150px,1fr)_auto] sm:gap-5"
                  >
                    <Avatar name={project.brand.name} className="h-10 w-10" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold tracking-tight text-foreground">{project.name}</span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-muted-foreground">{project.brand.name}</span>
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Progress</span>
                        <span className="tabular-nums text-foreground">{progress}%</span>
                      </span>
                      <span className="block h-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${progress}%` }} />
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span className={cn("h-2 w-2 rounded-full", statusTone(project.status))} />
                      <span className="hidden sm:inline">{statusLabel(project.status)}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelected(null);
          }}
        >
          <section
            aria-labelledby="project-detail-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-[2rem] border bg-card p-7 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active deliverable</p>
                <h2 id="project-detail-title" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.brand.name}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close project details">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/50 bg-muted/40 p-4"><p className="text-xs font-medium text-muted-foreground">Status</p><p className="mt-2 flex items-center gap-2 font-semibold text-foreground"><span className={cn("h-2 w-2 rounded-full", statusTone(selected.status))} />{statusLabel(selected.status)}</p></div>
              <div className="rounded-2xl border border-border/50 bg-muted/40 p-4"><p className="text-xs font-medium text-muted-foreground">Progress</p><p className="mt-2 font-semibold text-foreground">{amount(selected.gmvTarget) > 0 ? Math.min(100, Math.round((amount(selected.actualGmv) / amount(selected.gmvTarget)) * 100)) : 0}%</p></div>
            </div>
            <div className="mt-3 rounded-2xl border border-border/50 bg-muted/40 p-4"><p className="text-xs font-medium text-muted-foreground">Campaign health</p><div className="mt-3 flex items-center gap-3 text-sm font-medium text-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Delivery is on track</div><div className="mt-2 flex items-center gap-3 text-sm font-medium text-foreground"><Clock3 className="h-4 w-4 text-muted-foreground" /> Next review is scheduled</div></div>
          </section>
        </div>
      ) : null}
    </>
  );
}
