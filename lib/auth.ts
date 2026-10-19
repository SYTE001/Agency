import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { isRole, type Role } from "@/lib/constants";
import { getSafeRedirectUrl } from "@/lib/redirect";

export { hashPassword, verifyPassword } from "@/lib/password";

export const SESSION_COOKIE = "taos-session";

const TOKEN_ISSUER = "agency-os";
const TOKEN_AUDIENCE = "agency-os-app";
const TOKEN_ALGORITHM = "HS256";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
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
  agencyName: string;
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

export const resolveSessionUser = cache(async function resolveSessionUser(
  token: string,
): Promise<SessionUser | null> {
  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { agency: { select: { name: true } } },
  });
  if (!user) return null;

  if (!isRole(user.role)) return null;

  return {
    id: user.id,
    agencyId: user.agencyId,
    role: user.role,
    email: user.email,
    name: user.name,
    agencyName: user.agency.name,
  };
});

export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveSessionUser(token);
});

export async function requireUser(): Promise<SessionUser> {

  const user = await getSessionUser();
  if (!user) {
    let nextQuery = "";
    try {
      const headerList = await headers();
      const pathname = headerList.get("x-pathname");
      const search = headerList.get("x-search") || "";
      if (pathname) {
        const full = `${pathname}${search}`;
        const safe = getSafeRedirectUrl(full, "");
        if (safe && safe !== "/overview" && safe !== "/") {
          nextQuery = `?next=${encodeURIComponent(safe)}`;
        }
      }
    } catch {
      // In tests or outside Next request context, headers() might throw
    }
    redirect(`/login${nextQuery}`);
  }
  return user;
}
