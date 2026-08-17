import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import type { Role } from "@/lib/constants";
import { globalSearch } from "@/lib/services/search";

// Route handlers are not cached by default (they read the session cookie),
// so this always reflects the current database state.
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return Response.json({ groups: [] });
  }
  const groups = await globalSearch(user.agencyId, user.role as Role, q);
  return Response.json({ groups });
}
