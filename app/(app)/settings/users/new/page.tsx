import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCreateForm } from "@/components/settings/user-form";

export default async function NewAgencyUserPage() {
  const user = await requireUser();
  if (!can(user.role, "setting", "write")) notFound();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Tambah Anggota"
        description="Buat akun anggota baru untuk agensi Anda"
      />
      <SettingsNav active="team" />
      <Card>
        <CardHeader>
          <CardTitle>Data Anggota</CardTitle>
        </CardHeader>
        <CardContent>
          <UserCreateForm />
          <p className="mt-3 text-xs text-muted-foreground">
            Bagikan password awal kepada anggota secara aman — anggota dapat menggantinya nanti.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
