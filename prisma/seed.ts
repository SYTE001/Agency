import "dotenv/config";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const DEFAULT_AGENCY_NAME = "Agency OS";
const DEFAULT_AGENCY_SLUG = "agency-os";

function fail(msg: string): never {
  console.error(`[error] ${msg}`);
  process.exit(1);
}

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("OWNER_EMAIL wajib diisi dengan alamat email valid.\n  Contoh: OWNER_EMAIL=owner@agency.test npx prisma db seed");
  }
  if (!password) {
    fail("OWNER_PASSWORD wajib diisi (environment variable, tidak pernah di-commit).\n  Contoh: OWNER_PASSWORD='…' npx prisma db seed");
  }
  if (password.length < 12) {
    fail("OWNER_PASSWORD terlalu pendek — gunakan minimal 12 karakter.");
  }

  const name = process.env.AGENCY_NAME?.trim() || DEFAULT_AGENCY_NAME;
  const slug = process.env.AGENCY_SLUG?.trim().toLowerCase() || DEFAULT_AGENCY_SLUG;

  let agency = await prisma.agency.findUnique({ where: { slug } });
  if (agency) {
    console.log(`[seed] Agency sudah ada: ${agency.name} (slug=${agency.slug})`);
  } else {
    agency = await prisma.agency.create({ data: { name, slug } });
    console.log(`[seed] Agency dibuat: ${agency.name} (slug=${agency.slug})`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(
      `[seed] Owner sudah ada: ${email} (role=${existing.role}) — tidak ada perubahan.`,
    );
  } else {
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        agencyId: agency.id,
        email,
        name: process.env.OWNER_NAME?.trim() || "Agency Owner",
        role: "owner",
        title: "Agency Owner",
        passwordHash,
      },
    });
    console.log(`[seed] Owner dibuat: ${email} (role=owner)`);
  }


  const [agencies, users, brands, creators, products, campaigns] = await Promise.all([
    prisma.agency.count(),
    prisma.user.count(),
    prisma.brand.count(),
    prisma.creator.count(),
    prisma.product.count(),
    prisma.campaign.count(),
  ]);
  console.log(
    `\nBootstrap selesai. Database berisi ${agencies} agensi, ${users} user, ` +
      `${brands} brand, ${creators} creator, ${products} produk, ${campaigns} campaign — ` +
      `data bisnis diisi lewat UI, bukan seed.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
