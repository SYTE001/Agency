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

export function isSafeInternalRedirect(target: unknown): target is string {
  if (typeof target !== "string") return false;
  const trimmed = target.trim();
  if (!trimmed) return false;

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\")
  ) {
    return false;
  }

  if (/[\r\n\0]/.test(trimmed)) {
    return false;
  }

  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false;
  }

  try {
    const url = new URL(trimmed, "http://localhost");
    if (url.origin !== "http://localhost" || url.hostname !== "localhost") {
      return false;
    }

    const { pathname } = url;

    if (pathname === "/login" || pathname.startsWith("/login/")) {
      return false;
    }

    if (pathname === "/") return true;

    return VALID_INTERNAL_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  } catch {
    return false;
  }
}

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

