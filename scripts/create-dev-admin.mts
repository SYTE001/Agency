import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
  const email = (process.env.DEV_ADMIN_EMAIL || "admin@agency.test").trim().toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD || "localdev-admin-pass-1";
  const name = (process.env.DEV_ADMIN_NAME || "Agency Admin").trim();
  const role = "admin";
  const title = "Development Administrator";

  const agency = await prisma.agency.findFirst();
  if (!agency) {
    console.error("✖ Belum ada agency di database. Jalankan prisma db seed terlebih dahulu.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await hashPassword(password);

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        name,
        role,
        title,
        passwordHash,
      },
    });
    console.log(`✔ Akun admin dev berhasil diperbarui: ${email} (role=${role})`);
  } else {
    await prisma.user.create({
      data: {
        agencyId: agency.id,
        email,
        name,
        role,
        title,
        passwordHash,
      },
    });
    console.log(`✔ Akun admin dev berhasil dibuat: ${email} (role=${role})`);
  }

  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${role}`);
  console.log(`Agency: ${agency.name} (${agency.slug})`);
}

main()
  .catch((err) => {
    console.error("✖ Gagal membuat akun admin dev:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
