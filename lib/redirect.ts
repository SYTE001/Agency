/**
 * Known valid internal route prefixes in Agency OS.
 * Used to ensure destinations point to real internal routes and prevent open redirects.
 */
export const VALID_INTERNAL_PREFIXES = [
  "/overview",
  "/brands",
  "/campaigns",
  "/content",
  "/creators",
  "/finance",
  "/live",
  "/products",
  "/reports",
  "/settings",
  "/tasks",
  "/search",
] as const;

/**
 * Checks whether a given path or URL string is a safe internal application route.
 * Rejects:
 * - External domains / absolute URLs (http://, https://, //example.com)
 * - Scheme-relative or backslash-tricked targets (/\evil.com, \\evil.com)
 * - Control characters / CRLF / null bytes
 * - Non-HTTP schemes (javascript:, data:, vbscript:)
 * - Auth loop destinations (/login, /login?...)
 * - Arbitrary unmapped external paths
 */
export function isSafeInternalRedirect(target: unknown): target is string {
  if (typeof target !== "string") return false;
  const trimmed = target.trim();
  if (!trimmed) return false;

  // Must begin with a single forward slash and not double slash or slash-backslash
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\")
  ) {
    return false;
  }

  // Reject CRLF injection or null characters
  if (/[\r\n\0]/.test(trimmed)) {
    return false;
  }

  // Reject any schemes (e.g. javascript:, data:, https:)
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false;
  }

  try {
    // Parse using dummy base to inspect resolved pathname and search
    const url = new URL(trimmed, "http://localhost");
    if (url.origin !== "http://localhost" || url.hostname !== "localhost") {
      return false;
    }

    const pathname = url.pathname;

    // Prevent redirect loops back to login
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      return false;
    }

    // Must match root or known internal prefixes
    if (pathname === "/") return true;

    return VALID_INTERNAL_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes a redirect target. If valid, returns the target path + search + hash.
 * If invalid or unsafe, returns the safe default fallback (default: /overview).
 */
export function getSafeRedirectUrl(target: unknown, defaultFallback = "/overview"): string {
  if (isSafeInternalRedirect(target)) {
    try {
      const url = new URL(target.trim(), "http://localhost");
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return defaultFallback;
    }
  }
  return defaultFallback;
}
