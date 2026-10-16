import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-search", search);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // For protected routes, disallow client and intermediate caching (prevent bfcache after logout)
  const isProtectedRoute =
    pathname === "/overview" ||
    pathname.startsWith("/brands") ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/content") ||
    pathname.startsWith("/creators") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/live") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/search");

  if (isProtectedRoute) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

// Support both export names for backwards compatibility across Next.js tooling
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.css, .js, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)",
  ],
};
