import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
await import("../generated/prisma-sqlite/client");

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const client = new PrismaClient({ adapter });

try {
  await client.$queryRaw`SELECT 1`;
  console.log("SQLite connection and query OK");
} catch (e) {
  console.error("FAIL:", e.message);
} finally {
  await client.$disconnect();
}
