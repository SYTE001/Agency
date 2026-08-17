import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import type { Role } from "@/lib/constants";

export { hashPassword, verifyPassword } from "@/lib/password";

export const SESSION_COOKIE = "taos_session";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "taos-dev-secret-change-me-in-production";
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
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

/**
 * Resolve the current signed-in user from the session cookie.
 * Re-loads the user row so role/agency changes take effect immediately.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;

  return {
    id: user.id,
    agencyId: user.agencyId,
    role: user.role as Role,
    email: user.email,
    name: user.name,
  };
}

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
