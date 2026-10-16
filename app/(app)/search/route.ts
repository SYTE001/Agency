import { getSessionUser } from "@/lib/auth";
import { globalSearch } from "@/lib/services/search";

// Route handlers are not cached by default (they read the session cookie),
// so this always reflects the current database state.
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return Response.json({ groups: [] });
  }
  const groups = await globalSearch(user.agencyId, user.role, q);
  return Response.json({ groups });
}
