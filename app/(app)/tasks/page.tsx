import Link from "next/link";
import { CalendarDays, CheckSquare, Search } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/constants";
import { getTaskCounts, listTasks } from "@/lib/services/tasks";
import type { TaskFilters } from "@/lib/services/tasks";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TaskStatusButton } from "@/components/tasks/task-status-button";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const RELATED_LABEL: Record<string, string> = {
  Creator: "Creator",
  Brand: "Brand",
  Campaign: "Campaign",
  Content: "Konten",
  LiveSession: "LIVE",
};

const TABS = [
  { key: undefined, label: "Semua" },
  { key: "Open", label: "Open" },
  { key: "InProgress", label: "Dikerjakan" },
  { key: "Done", label: "Selesai" },
] as const;

export default async function TasksPage(props: PageProps<"/tasks">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const statusParam = str(searchParams.status);
  const filters: TaskFilters = {
    q: str(searchParams.q),
    status: statusParam && (TASK_STATUS as readonly string[]).includes(statusParam) ? statusParam : undefined,
    priority: str(searchParams.priority),
    ownerId: str(searchParams.ownerId),
    overdue: str(searchParams.overdue) === "1",
    page: num(searchParams.page) ?? 1,
  };

  const [result, counts, owners] = await Promise.all([
    listTasks(user.agencyId, filters),
    getTaskCounts(user.agencyId),
    prisma.user.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const canWrite = can(user.role, "task", "write");
  const hasFilter = Boolean(filters.q || filters.status || filters.priority || filters.ownerId || filters.overdue);
  const now = new Date();

  const tabHref = (status?: string) => {
    const params = new URLSearchParams(
      Object.entries(flattenParams(searchParams)).filter(([k]) => k !== "status" && k !== "page" && k !== "overdue"),
    );
    if (status) params.set("status", status);
    const qs = params.toString();
    return qs ? `/tasks?${qs}` : "/tasks";
  };

  const kpis = [
    { label: "Open", value: counts.open },
    { label: "Dikerjakan", value: counts.inProgress },
    { label: "Terlambat", value: counts.overdue, tone: counts.overdue > 0 ? "text-destructive" : "" },
    { label: "Selesai", value: counts.done },
  ];

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Tasks" description={`${result.total} task operasional agensi`}>
        {canWrite ? (
          <Link
            href="/tasks/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Task Baru
          </Link>
        ) : null}
      </PageHeader>

      {/* KPI chips */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={cn("mt-1 text-base font-semibold", k.tone)}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {TABS.map((t) => (
          <Link
            key={t.label}
            href={tabHref(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filters.status === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Cari judul task…" className="w-56 pl-8" />
        </div>
        <Select name="priority" defaultValue={filters.priority ?? ""} className="w-36">
          <option value="">Semua prioritas</option>
          {TASK_PRIORITY.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <Select name="ownerId" defaultValue={filters.ownerId ?? ""} className="w-44">
          <option value="">Semua PIC</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </Select>
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
          <input type="checkbox" name="overdue" value="1" defaultChecked={filters.overdue} className="accent-brand" />
          Terlambat
        </label>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/tasks"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Tidak ada task"
          description={
            hasFilter
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Belum ada task. Buat task operasional pertama Anda."
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-60">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                {canWrite ? <TableHead>Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((t) => {
                const overdue =
                  t.dueDate !== null && t.dueDate < now && (t.status === "Open" || t.status === "InProgress");
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span className="block font-medium">{t.title}</span>
                      {t.notes ? (
                        <span className="block max-w-md truncate text-xs text-muted-foreground">{t.notes}</span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        {t.relatedType ? RELATED_LABEL[t.relatedType] ?? t.relatedType : "Umum"}
                        {t.status === "Done" && t.completedBy
                          ? ` · diselesaikan oleh ${t.completedBy.name}`
                          : t.createdBy
                            ? ` · dibuat oleh ${t.createdBy.name}`
                            : null}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell>
                      <Badge variant={t.priority === "Urgent" ? "destructive" : t.priority === "High" ? "warning" : "secondary"}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.owner?.name ?? "—"}</TableCell>
                    <TableCell className={cn("whitespace-nowrap", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {t.dueDate ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(t.dueDate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {canWrite ? (
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {t.status === "Open" ? (
                            <TaskStatusButton taskId={t.id} status="InProgress" label="Kerjakan" />
                          ) : null}
                          {t.status === "InProgress" ? (
                            <TaskStatusButton taskId={t.id} status="Open" label="Buka lagi" />
                          ) : null}
                          {t.status !== "Done" && t.status !== "Cancelled" ? (
                            <TaskStatusButton taskId={t.id} status="Done" label="Selesai" variant="success" />
                          ) : null}
                          {t.status === "Done" ? (
                            <TaskStatusButton taskId={t.id} status="Open" label="Buka lagi" />
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/tasks"
            searchParams={flattenParams(searchParams)}
          />
        </div>
      )}
    </div>
  );
}

function flattenParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v !== "") out[k] = v;
  }
  return out;
}
