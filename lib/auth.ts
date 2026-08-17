import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { isRole, type Role } from "@/lib/constants";

export { hashPassword, verifyPassword } from "@/lib/password";

export const SESSION_COOKIE = "taos_session";

// Token issuer/audience: binding a session token to this app prevents tokens
// signed for (or by) another service with a shared secret from being accepted.
const TOKEN_ISSUER = "agency-os";
const TOKEN_AUDIENCE = "agency-os-app";
// Only HS256 is ever issued or accepted — pinned on both sign and verify so a
// token with a swapped algorithm header (e.g. "none") can never pass.
const TOKEN_ALGORITHM = "HS256";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Never fall back to a hardcoded key in production: a predictable signing
    // secret lets anyone forge session tokens. Only local development may proceed
    // without one.
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET wajib diisi (minimal 32 karakter) untuk produksi.");
    }
    return new TextEncoder().encode("taos-dev-secret-local-only");
  }
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET terlalu pendek — gunakan minimal 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  agencyId: string;
  role: Role;
  email: string;
  name: string;
};

type TokenPayload = {
  sub: string;
};

export async function createSessionToken(user: {
  id: string;
  agencyId: string;
  role: string;
  email: string;
  name: string;
}): Promise<string> {
  return new SignJWT({
    agencyId: user.agencyId,
    role: user.role,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: TOKEN_ALGORITHM })
    .setSubject(user.id)
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

// Exported for tests only (lib/auth.test.ts) so the verifier's HS256/iss/aud
// pinning can be exercised directly; app code must use getSessionUser().
export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: [TOKEN_ALGORITHM],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

/**
 * Verify a session token and re-resolve the user from the database. Session
 * data (agencyId/role) always comes from the DB row, never from the token
 * claims — tampered or stale claims still resolve to the current row.
 * Exported so tests can exercise the full resolution path without the Next
 * cookie transport.
 */
export async function resolveSessionUser(token: string): Promise<SessionUser | null> {
  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;

  // Validate the role against the known union before trusting it — the column
  // is a free String in the DB, so an unexpected value must never flow into
  // authorization as if it were a Role.
  if (!isRole(user.role)) return null;

  return {
    id: user.id,
    agencyId: user.agencyId,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

/**
 * Resolve the current signed-in user from the session cookie.
 * Re-loads the user row so role/agency changes take effect immediately.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveSessionUser(token);
}

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
