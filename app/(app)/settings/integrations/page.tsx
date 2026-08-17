import { Plug, RefreshCw, Upload } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { getOrCreateIntegration, listSyncJobs } from "@/lib/services/integrations";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ImportCsvForm, SyncButton } from "@/components/settings/integration-form";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function IntegrationsPage() {
  const user = await requireUser();
  if (!can(user.role as Role, "integration", "read")) {
    return (
      <div className="p-6">
        <EmptyState
          title="Tidak ada akses"
          description="Halaman integrasi hanya tersedia untuk Owner dan Admin."
        />
      </div>
    );
  }

  const [integration, syncJobs] = await Promise.all([
    getOrCreateIntegration(user.agencyId),
    listSyncJobs(user.agencyId, 8),
  ]);

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Integrasi"
        description="Hubungkan sumber data eksternal, impor CSV, dan jalankan sinkronisasi — PLAN §19: data selalu masuk lewat integration layer, tidak pernah langsung ke TikTok"
      />

      {/* Provider connection */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Plug className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{integration.provider} (Partner API)</p>
              <p className="text-xs text-muted-foreground">
                Mode mock — OAuth TikTok belum diaktifkan untuk MVP. External ID disimpan di setiap
                creator, brand, produk, dan campaign agar sync tidak membuat duplikat.
              </p>
            </div>
          </div>
          <StatusBadge status={integration.status} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sync */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="size-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Sinkronisasi Data</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Menarik metrik creator (berdasarkan externalId) dan menambah GMV campaign aktif. Semua
              langkah tercatat di log sync di bawah.
            </p>
            <SyncButton />
          </CardContent>
        </Card>

        {/* CSV import */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Import CSV</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Import massal creator atau produk dari file CSV — termasuk external ID dari TikTok.
            </p>
            <ImportCsvForm />
          </CardContent>
        </Card>
      </div>

      {/* Sync logs */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">Log Sinkronisasi</p>
          {syncJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada sinkronisasi yang dijalankan.
            </p>
          ) : (
            <div className="space-y-3">
              {syncJobs.map((job) => (
                <div key={job.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={job.status} />
                    <span className="text-sm font-medium">{job.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {job.finishedAt
                        ? formatDateTime(job.finishedAt)
                        : job.startedAt
                          ? `mulai ${formatDateTime(job.startedAt)}`
                          : formatDateTime(job.createdAt)}
                    </span>
                  </div>
                  {job.logs.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-l pl-3 text-xs">
                      {job.logs.map((l) => (
                        <li
                          key={l.id}
                          className={cn(
                            "text-muted-foreground",
                            l.level === "error" && "text-destructive",
                            l.level === "warn" && "text-warning",
                          )}
                        >
                          {l.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
