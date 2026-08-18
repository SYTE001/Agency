// Singleton Prisma client. Provider-agnostic: the adapter (PostgreSQL via
// `pg` in production, better-sqlite3 in local dev) is chosen from
// DATABASE_URL / DB_PROVIDER — see lib/dbProvider.ts.
import { createPrismaClient, type PrismaClient } from "@/lib/prismaClient";

export type { Prisma } from "@/lib/prismaClient";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

export default prisma;
