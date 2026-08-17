import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsNav } from "@/components/settings/settings-nav";
import { formatDate } from "@/lib/format";

export default async function SettingsAgencyPage() {
  const user = await requireUser();
  if (!can(user.role as Role, "setting", "read")) {
    return (
      <div className="p-6">
        <EmptyState title="Tidak ada akses" description="Role Anda tidak memiliki akses ke pengaturan." />
      </div>
    );
  }

  const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
  if (!agency) {
    return (
      <div className="p-6">
        <EmptyState title="Agensi tidak ditemukan" description="Data agensi Anda tidak ditemukan." />
      </div>
    );
  }

  const rows = [
    { label: "Nama agensi", value: agency.name },
    { label: "Slug", value: agency.slug },
    { label: "Zona waktu", value: agency.timezone },
    { label: "Mata uang", value: agency.currency },
    { label: "Dibuat", value: formatDate(agency.createdAt) },
  ];

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Settings" description="Profil dan pengaturan agensi Anda" />

      <SettingsNav active="agency" />

      <Card>
        <CardContent className="p-4">
          <dl className="space-y-2.5 text-sm">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{r.label}</dt>
                <dd className="font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Pengeditan profil agensi (nama, zona waktu, mata uang) tersedia untuk Owner pada rilis
            berikutnya. Semua data aplikasi ini terisolasi per agensi (multi-tenant sejak hari
            pertama).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
