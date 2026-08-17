import Link from "next/link";
import { Clapperboard, ListChecks, Search } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { KANBAN_COLUMNS, getContentBoard } from "@/lib/services/content";
import type { ContentFilters, ContentRow } from "@/lib/services/content";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  Brief: "Brief",
  Assigned: "Ditugaskan",
  WaitingForDraft: "Menunggu Draft",
  DraftSubmitted: "Draft Masuk",
  Revision: "Revisi",
  Approved: "Disetujui",
  Scheduled: "Terjadwal",
  Published: "Published",
  Rejected: "Ditolak",
  Cancelled: "Dibatalkan",
};

const OPEN_STATUSES = ["Brief", "Assigned", "WaitingForDraft", "DraftSubmitted", "Revision"];

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function ContentPage(props: PageProps<"/content">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const filters: ContentFilters = {
    q: str(searchParams.q),
    campaignId: str(searchParams.campaignId),
    creatorId: str(searchParams.creatorId),
    overdue: str(searchParams.overdue) === "1",
  };

  const [board, campaigns, creators] = await Promise.all([
    getContentBoard(user.agencyId, filters),
    prisma.campaign.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creator.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);
  const canWrite = can(user.role as Role, "content", "write");
  const now = new Date();
  const hasFilter = Boolean(filters.q || filters.campaignId || filters.creatorId || filters.overdue);

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Content" description={`${board.total} konten di pipeline`}>
        <Link
          href="/content/review"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          <ListChecks className="h-4 w-4" />
          Antrian Review
        </Link>
        {canWrite ? (
          <Link
            href="/content/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Konten Baru
          </Link>
        ) : null}
      </PageHeader>

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Cari judul konten…" className="w-56 pl-8" />
        </div>
        <Select name="campaignId" defaultValue={filters.campaignId ?? ""} className="w-48">
          <option value="">Semua campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select name="creatorId" defaultValue={filters.creatorId ?? ""} className="w-44">
          <option value="">Semua creator</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </Select>
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
          <input type="checkbox" name="overdue" value="1" defaultChecked={filters.overdue} className="accent-brand" />
          Terlambat
        </label>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/content"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {board.total === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="Tidak ada konten"
          description={
            hasFilter
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Belum ada konten di pipeline. Buat brief konten pertama Anda."
          }
        />
      ) : (
        <div className="-mx-6 overflow-x-auto px-6 pb-2">
          <div className="flex min-w-max gap-3">
            {KANBAN_COLUMNS.map((status) => {
              const rows = board.byStatus.get(status) ?? [];
              return (
                <div key={status} className="w-64 shrink-0 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide">{STATUS_LABEL[status] ?? status}</p>
                    <span className="text-xs text-muted-foreground">{rows.length}</span>
                  </div>
                  <div className="max-h-[70vh] space-y-2 overflow-y-auto p-2">
                    {rows.length === 0 ? (
                      <p className="px-1 py-3 text-center text-xs text-muted-foreground">Kosong</p>
                    ) : (
                      rows.map((row) => <ContentCard key={row.id} row={row} now={now} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({ row, now }: { row: ContentRow; now: Date }) {
  const overdue = row.dueDate !== null && row.dueDate < now && OPEN_STATUSES.includes(row.status);
  return (
    <Link
      href={`/content/${row.id}`}
      className="block rounded-md border bg-card p-2.5 text-sm shadow-sm transition-colors hover:bg-accent/60"
    >
      <p className="leading-snug font-medium">{row.title}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.campaignName}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{row.creatorName}</span>
        {row.dueDate ? (
          <span className={overdue ? "font-medium text-destructive" : ""}>
            {formatDate(row.dueDate)}
          </span>
        ) : null}
      </div>
      {row.revisionCount > 0 ? (
        <Badge variant="warning" className="mt-1.5 font-normal">
          Revisi {row.revisionCount}
        </Badge>
      ) : null}
    </Link>
  );
}
