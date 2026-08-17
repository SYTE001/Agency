import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Read-only matrix of the RBAC model (PLAN §16). Roles are provisioned per
// agency during onboarding; editing them is intentionally out of the MVP.
const ACTIONS = ["read", "write", "manage"] as const;
const RESOURCES = [
  "creator",
  "brand",
  "campaign",
  "content",
  "live",
  "product",
  "finance",
  "task",
  "report",
  "setting",
  "integration",
] as const;

function allows(role: Role, resource: string, action: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(`${resource}:${action}` as never);
}

export default async function SettingsRolesPage() {
  const user = await requireUser();
  if (!can(user.role, "setting", "read")) {
    return (
      <div className="p-6">
        <EmptyState title="Tidak ada akses" description="Role Anda tidak memiliki akses ke pengaturan." />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Settings"
        description="Matriks hak akses setiap role (read-only, sesuai PLAN §16)"
      />

      <SettingsNav active="roles" />

      <Card>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-medium text-muted-foreground">Resource</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-2 py-2 text-center font-medium text-muted-foreground">
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map((res) => (
                  <tr key={res} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium capitalize">{res}</td>
                    {ROLES.map((role) => {
                      const full =
                        allows(role, res, "manage") && allows(role, res, "write") && allows(role, res, "read");
                      const some = ACTIONS.some((a) => allows(role, res, a));
                      return (
                        <td key={role} className="px-2 py-2 text-center">
                          <span
                            className={cn(
                              "inline-flex size-5 items-center justify-center rounded",
                              full
                                ? "bg-success/15 text-success"
                                : some
                                  ? "bg-warning/15 text-warning"
                                  : "text-muted-foreground/40",
                            )}
                            title={
                              full
                                ? "Akses penuh"
                                : some
                                  ? ACTIONS.filter((a) => allows(role, res, a)).join(" + ")
                                  : "Tidak ada akses"
                            }
                          >
                            {full ? <Check className="size-3.5" /> : some ? <span className="text-[10px] font-bold">±</span> : <Minus className="size-3.5" />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <Check className="inline size-3 text-success" /> = akses penuh (read + write + manage) ·{" "}
            <span className="font-bold text-warning">±</span> = sebagian · Owner dan Admin memegang
            akses penuh (“*”).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
