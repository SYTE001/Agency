import { ROLE_PERMISSIONS } from "@/lib/constants";
import type { Action, Permission, Resource, Role } from "@/lib/constants";

/** Does this role hold the given permission (or "*")? */
export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

/** Convenience: can(role, "finance", "write") */
export function can(role: Role, resource: Resource, action: Action): boolean {
  return hasPermission(role, `${resource}:${action}` as Permission);
}

/** All resources a role can at least read. */
export function readableResources(role: Role): Resource[] {
  if (hasPermission(role, "*")) {
    return [
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
    ];
  }
  return (
    (["creator", "brand", "campaign", "content", "live", "product", "finance", "task", "report", "setting", "integration"] as Resource[]).filter(
      (r) => can(role, r, "read"),
    )
  );
}
