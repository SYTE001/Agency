// User management service (Phase 3, P1 #4).
//
// Agency-scoped member administration on top of the existing auth stack.
// The session already re-resolves role/agencyId from the DB row on every
// request (lib/auth.ts), so role changes made here take effect immediately —
// there is no separate session state to invalidate.
//
// passwordHash is write-only through this service: it is hashed here
// (lib/password scrypt) and never included in any read.
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { isRole } from "@/lib/constants";

/** Identity + role of whoever triggered the mutation (from requireUser()). */
export type ActorContext = { id: string; role: string };

const USER_LIST_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  title: true,
  avatarUrl: true,
  createdAt: true,
} as const;

/** All members of one agency — never exposes auth-sensitive columns. */
export async function listAgencyUsers(agencyId: string) {
  return prisma.user.findMany({
    where: { agencyId },
    orderBy: [{ createdAt: "asc" }],
    select: USER_LIST_FIELDS,
  });
}

export async function createAgencyUser(
  agencyId: string,
  actor: ActorContext,
  data: { name: string; email: string; title?: string | null; role: string; password: string },
) {
  if (!isRole(data.role)) throw new Error("Role tidak valid");
  // Granting the top role is an owner-only decision.
  if (data.role === "owner" && actor.role !== "owner") {
    throw new Error("Hanya Owner yang dapat menambah Owner baru");
  }
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error("Email sudah terdaftar");

  const passwordHash = await hashPassword(data.password);
  try {
    return await prisma.user.create({
      data: {
        agencyId, // always derived from the authenticated session by the caller
        name: data.name.trim(),
        email,
        title: data.title?.trim() || null,
        role: data.role,
        passwordHash,
      },
    });
  } catch (e) {
    console.error("createAgencyUser failed", e);
    if (e instanceof Error && /unique constraint/i.test(e.message)) {
      throw new Error("Email sudah terdaftar");
    }
    throw new Error("Gagal menyimpan anggota");
  }
}

export async function updateAgencyUser(
  agencyId: string,
  actor: ActorContext,
  userId: string,
  data: Partial<{ name: string; title: string | null; role: string }>,
) {
  const member = await prisma.user.findFirst({
    where: { id: userId, agencyId },
    select: { id: true, name: true, role: true },
  });
  if (!member) throw new Error("Anggota tidak ditemukan");

  const actorIsOwner = actor.role === "owner";
  // Admins manage regular members but may never touch an owner account —
  // only an owner can modify another owner (blocks admin→owner escalation).
  if (member.role === "owner" && !actorIsOwner) {
    throw new Error("Hanya Owner yang dapat mengubah akun Owner");
  }

  let nextRole: string | undefined;
  if (data.role !== undefined) {
    if (!isRole(data.role)) throw new Error("Role tidak valid");
    if (data.role === "owner" && !actorIsOwner) {
      throw new Error("Hanya Owner yang dapat menetapkan role Owner");
    }
    // Self-protection: changing your own role can lock you out of the agency
    // (a demoted sole owner has nobody left who can restore access).
    if (actor.id === userId && data.role !== member.role) {
      throw new Error("Anda tidak dapat mengubah role Anda sendiri");
    }
    // Last-owner protection: demoting an owner must leave at least one owner.
    if (member.role === "owner" && data.role !== "owner") {
      const otherOwners = await prisma.user.count({
        where: { agencyId, role: "owner", id: { not: userId } },
      });
      if (otherOwners === 0) {
        throw new Error("Agensi harus tetap memiliki minimal satu Owner");
      }
    }
    nextRole = data.role;
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.title !== undefined ? { title: (data.title ?? "").trim() || null } : {}),
        ...(nextRole !== undefined ? { role: nextRole } : {}),
      },
    });
  } catch (e) {
    console.error("updateAgencyUser failed", e);
    throw new Error("Gagal menyimpan perubahan anggota");
  }
}
