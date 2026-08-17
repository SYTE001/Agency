// Seed script: realistic Indonesian agency data (PLAN §21).
// Deterministic PRNG so the dataset is reproducible across runs.
import "dotenv/config";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import {
  calculateAgencyRevenue,
  calculateCreatorCommission,
} from "@/lib/finance";

// ---------------------------------------------------------------------------
// Deterministic RNG + helpers
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260817);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function uid(prefix: string, i: number): string {
  return `${prefix}-${String(i + 1).padStart(3, "0")}`;
}

const NOW = new Date();
function daysAgo(n: number, hour = 12): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 15): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Static pools
// ---------------------------------------------------------------------------

const AGENCY = { name: "Kreatif Nusantara", slug: "kreatif-nusantara" };

const USERS = [
  { id: "user-001", name: "Andi Wijaya", email: "andi@kreatifnusantara.id", role: "owner", title: "Agency Owner" },
  { id: "user-002", name: "Siti Rahma", email: "siti@kreatifnusantara.id", role: "account_manager", title: "Account Manager" },
  { id: "user-003", name: "Budi Santoso", email: "budi@kreatifnusantara.id", role: "creator_manager", title: "Creator Manager" },
  { id: "user-004", name: "Dewi Lestari", email: "dewi@kreatifnusantara.id", role: "campaign_manager", title: "Campaign Manager" },
  { id: "user-005", name: "Rina Kartika", email: "rina@kreatifnusantara.id", role: "finance", title: "Finance Lead" },
];

const BRANDS: { name: string; industry: string }[] = [
  { name: "Glowella", industry: "Skincare" },
  { name: "Kopi Seduh", industry: "Food & Beverage" },
  { name: "Serat Kaos", industry: "Fashion" },
  { name: "Dapur Rasa", industry: "Food & Beverage" },
  { name: "Bening Skincare", industry: "Skincare" },
  { name: "Garuda Coffee", industry: "Food & Beverage" },
  { name: "Lumiere Beauty", industry: "Beauty" },
  { name: "Aksara Apparel", industry: "Fashion" },
  { name: "Sedia Makan", industry: "Food & Beverage" },
  { name: "Kulit Sehat", industry: "Skincare" },
  { name: "Ruang Rumah", industry: "Home & Living" },
  { name: "TechKita", industry: "Tech" },
  { name: "Petualang", industry: "Travel" },
  { name: "Bunda Pintar", industry: "Parenting" },
  { name: "FitNusantara", industry: "Fitness" },
  { name: "AutoJuara", industry: "Automotive" },
  { name: "Suara Nada", industry: "Music" },
  { name: "Cuan Finansial", industry: "Finance" },
  { name: "Edukita", industry: "Education" },
  { name: "PlayArena", industry: "Gaming" },
];

const FIRST_NAMES = [
  "Alya", "Bima", "Citra", "Daffa", "Eka", "Farhan", "Gita", "Hana", "Intan",
  "Joko", "Kaira", "Luna", "Maya", "Nadia", "Oki", "Putri", "Raka", "Salsa",
  "Tania", "Umar", "Vina", "Wahyu", "Yumna", "Zahra", "Andi", "Bella", "Caca",
  "Dewi", "Edo", "Fani", "Galih", "Hesti", "Ilham", "Jihan", "Kirana", "Lintang",
  "Mega", "Nanda", "Ocha", "Prita", "Qori", "Rina", "Sinta", "Tari", "Uli",
  "Vero", "Wulan", "Yudi", "Zaki",
];

const CATEGORY_SUFFIX: Record<string, string[]> = {
  Beauty: ["beauty", "glow", "makeup"],
  Fashion: ["style", "outfit", "fashion"],
  "Food & Beverage": ["makan", "kuliner", "foodie"],
  Skincare: ["skincare", "glow", "cantik"],
  Tech: ["tech", "gadget", "review"],
  Gaming: ["game", "gaming", "player"],
  Travel: ["travel", "jalan", "wonder"],
  Parenting: ["mama", "bunda", "parenting"],
  Fitness: ["fit", "gym", "health"],
  "Home & Living": ["home", "rumah", "decor"],
  Education: ["edu", "belajar", "course"],
  Automotive: ["mobil", "auto", "review"],
  Music: ["music", "cover", "song"],
  Finance: ["cuan", "finance", "invest"],
};

const PRODUCT_TYPES: Record<string, string[]> = {
  Skincare: ["Serum", "Moisturizer", "Toner", "Sunscreen", "Face Wash"],
  Beauty: ["Lipstick", "Mascara", "Foundation", "Blush", "Eyeshadow"],
  "Food & Beverage": ["Kopi Susu", "Cokelat", "Snack", "Keripik", "Minuman"],
  Fashion: ["Kaos", "Kemeja", "Jaket", "Celana", "Dress"],
  "Home & Living": ["Lilin Aroma", "Dekorasi", "Rak", "Lampu", "Bantal"],
  Tech: ["TWS", "Charger", "Smartwatch", "Powerbank", "Speaker"],
  Travel: ["Tas Travel", "Travel Kit", "Botol", "Packing Cube"],
  Parenting: ["Mainan Edukasi", "Popok", "Baju Anak", "Stroller"],
  Fitness: ["Whey", "Resistance Band", "Yoga Mat", "Dumbbell"],
  Automotive: ["Aksesori Mobil", "Pembersih", "Dashcam", "Parfum Mobil"],
  Music: ["Headphone", "Mic", "Audio Interface"],
  Finance: ["E-book", "Kursus", "Template"],
  Education: ["Kursus", "E-book", "Worksheet"],
  Gaming: ["Kursi Gaming", "Keyboard", "Mouse", "Headset"],
};

const TASK_TITLES = [
  "Follow up creator", "Review draft", "Approve campaign", "Confirm sample shipment",
  "Schedule LIVE", "Send client report", "Check settlement", "Update creator data",
  "Prepare campaign brief", "Negotiate creator fee", "Upload product catalog",
  "Verify GMV numbers", "Assign reviewer", "Reschedule LIVE session",
  "Collect content URL", "Send payout confirmation", "Update brand contract",
  "Onboard new creator", "Check overdue content", "Prepare weekly report",
];

const ACTIVITY_ACTIONS = [
  "updated creator", "created campaign", "approved content", "scheduled LIVE",
  "added note", "completed task", "recorded GMV", "assigned creator",
  "submitted draft", "requested revision", "paid settlement", "created payout",
  "updated brand", "imported products", "ended LIVE session",
];

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

async function reset() {
  const tables = [
    prisma.syncLog,
    prisma.syncJob,
    prisma.integration,
    prisma.report,
    prisma.activity,
    prisma.note,
    prisma.task,
    prisma.commission,
    prisma.creatorPayout,
    prisma.settlement,
    prisma.contentRevision,
    prisma.contentItem,
    prisma.liveMetric,
    prisma.liveSession,
    prisma.campaignCreator,
    prisma.campaignProduct,
    prisma.productMetric,
    prisma.creatorMetric,
    prisma.creatorPlatformAccount,
    prisma.product,
    prisma.creator,
    prisma.brandContact,
    prisma.brand,
    prisma.campaign,
    prisma.user,
    prisma.agency,
  ];
  for (const t of tables) {
    await (t as { deleteMany: () => Promise<unknown> }).deleteMany();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Resetting database…");
  await reset();

  // 1. Agency + users
  const passwordHash = await hashPassword("password123");
  await prisma.agency.create({
    data: { id: "agency-001", name: AGENCY.name, slug: AGENCY.slug },
  });
  await prisma.user.createMany({
    data: USERS.map((u) => ({
      id: u.id,
      agencyId: "agency-001",
      email: u.email,
      name: u.name,
      role: u.role,
      title: u.title,
      passwordHash,
    })),
  });

  // 2. Brands + contacts
  const brandIds = BRANDS.map((_, i) => uid("brand", i));
  await prisma.brand.createMany({
    data: BRANDS.map((b, i) => ({
      id: brandIds[i],
      agencyId: "agency-001",
      name: b.name,
      industry: b.industry,
      status: i === 18 ? "Churned" : i === 17 ? "Paused" : "Active",
      externalId: `tiktok-brand-${i + 1}`,
    })),
  });
  const contacts: { brandId: string; name: string; email: string; role: string; isPrimary: boolean }[] = [];
  BRANDS.forEach((b, i) => {
    const contactNames = ["Rara", "Tono", "Sari", "Bagus", "Nia"];
    contacts.push({
      brandId: brandIds[i],
      name: `${pick(contactNames)} ${b.name}`,
      email: `contact@${b.name.toLowerCase().replace(/\s+/g, "")}.co.id`,
      role: "Marketing Lead",
      isPrimary: true,
    });
    if (i % 3 === 0) {
      contacts.push({
        brandId: brandIds[i],
        name: `${pick(contactNames)} ${b.name}`,
        email: `ops@${b.name.toLowerCase().replace(/\s+/g, "")}.co.id`,
        role: "Operations",
        isPrimary: false,
      });
    }
  });
  await prisma.brandContact.createMany({ data: contacts });

  // 3. Creators + platform accounts + metrics
  const creators: {
    id: string; username: string; displayName: string; category: string;
    followers: number; engagementRate: number; health: string; status: string;
    managerId: string; monthlyGmv: number; trend: number;
  }[] = [];

  const usedHandles = new Set<string>();
  const managers = ["user-002", "user-003", "user-004"];
  const declineSet = new Set<number>([4, 11, 17, 23, 31, 38, 44, 52, 60, 67, 75, 83]);

  for (let i = 0; i < 100; i++) {
    const name = FIRST_NAMES[i % FIRST_NAMES.length];
    const category = CREATOR_CATEGORIES[i % CREATOR_CATEGORIES.length];
    const suffixes = CATEGORY_SUFFIX[category];
    let handle = `@${name.toLowerCase()}${suffixes[i % suffixes.length]}`;
    let n = 2;
    while (usedHandles.has(handle)) handle = `@${name.toLowerCase()}${suffixes[i % suffixes.length]}${n++}`;
    usedHandles.add(handle);

    const tierRoll = rand();
    let followers: number;
    let monthlyGmv: number;
    if (tierRoll < 0.25) {
      followers = randInt(10_000, 50_000);
      monthlyGmv = randInt(1_000_000, 20_000_000);
    } else if (tierRoll < 0.65) {
      followers = randInt(50_000, 500_000);
      monthlyGmv = randInt(20_000_000, 150_000_000);
    } else if (tierRoll < 0.9) {
      followers = randInt(500_000, 1_000_000);
      monthlyGmv = randInt(150_000_000, 500_000_000);
    } else {
      followers = randInt(1_000_000, 5_000_000);
      monthlyGmv = randInt(500_000_000, 2_000_000_000);
    }

    const declining = declineSet.has(i);
    const trend = declining ? -randInt(30, 55) / 100 : randInt(0, 45) / 100;
    const status = i % 17 === 0 ? "Inactive" : i % 23 === 0 ? "Paused" : "Active";
    const health = status === "Inactive"
      ? "Inactive"
      : declining
        ? "AtRisk"
        : trend < 0.1
          ? "Watch"
          : "Healthy";

    creators.push({
      id: uid("creator", i),
      username: handle,
      displayName: `${name} ${pick(["Putri", "Ramadhan", "Saputra", "Anggraini", "Pratama", "Wijaya", "Nugroho"])}`,
      category,
      followers,
      engagementRate: +(rand() * 11 + 1).toFixed(2),
      health,
      status,
      managerId: managers[i % managers.length],
      monthlyGmv,
      trend,
    });
  }

  await prisma.creator.createMany({
    data: creators.map((c) => ({
      id: c.id,
      agencyId: "agency-001",
      username: c.username,
      displayName: c.displayName,
      category: c.category,
      followers: c.followers,
      engagementRate: c.engagementRate,
      health: c.health,
      status: c.status,
      managerId: c.managerId,
      externalId: `tiktok-${c.username.replace("@", "")}`,
    })),
  });

  await prisma.creatorPlatformAccount.createMany({
    data: creators.map((c) => ({
      id: uid("cpacc", creators.indexOf(c)),
      creatorId: c.id,
      platform: "TikTok",
      handle: c.username.replace("@", ""),
      externalId: `tiktok-${c.username.replace("@", "")}`,
    })),
  });

  // Creator metrics: 45 daily snapshots each
  const creatorMetricRows: {
    id: string; creatorId: string; date: Date; followers: number;
    engagementRate: number; gmv: number; videos: number; avgViews: number; liveGmv: number;
  }[] = [];
  creators.forEach((c) => {
    const daily = c.monthlyGmv / 30;
    for (let d = 0; d < 45; d++) {
      const progress = d / 44; // 0..1 over time
      const trendFactor = 1 + c.trend * progress;
      const noise = 0.6 + rand() * 0.8;
      const gmv = daily * trendFactor * noise;
      creatorMetricRows.push({
        id: uid(`cm-${c.id}`, d),
        creatorId: c.id,
        date: daysAgo(44 - d),
        followers: Math.round(c.followers * (1 + progress * 0.04)),
        engagementRate: +(c.engagementRate * (0.85 + rand() * 0.3)).toFixed(2),
        gmv: Math.round(gmv),
        videos: randInt(0, 5),
        avgViews: Math.round(c.followers * (0.02 + rand() * 0.1)),
        liveGmv: Math.round(gmv * (0.3 + rand() * 0.7)),
      });
    }
  });
  await prisma.creatorMetric.createMany({ data: creatorMetricRows });

  // 4. Products + metrics
  const products: { id: string; brandId: string; name: string; category: string; price: number; gmv: number }[] = [];
  let productIdx = 0;
  BRANDS.forEach((b, bi) => {
    const types = PRODUCT_TYPES[b.industry] ?? ["Produk"];
    const count = 2 + (bi % 3);
    for (let k = 0; k < count; k++) {
      const price = randInt(49_000, 899_000);
      products.push({
        id: uid("product", productIdx),
        brandId: brandIds[bi],
        name: `${b.name} ${types[k % types.length]}`,
        category: b.industry,
        price,
        gmv: 0,
      });
      productIdx++;
    }
  });
  await prisma.product.createMany({
    data: products.map((p) => ({
      id: p.id,
      agencyId: "agency-001",
      brandId: p.brandId,
      name: p.name,
      category: p.category,
      price: p.price,
      externalId: `tiktok-prod-${p.id}`,
    })),
  });

  const productMetricRows: {
    id: string; productId: string; date: Date; gmv: number; orders: number; units: number;
  }[] = [];
  products.forEach((p) => {
    const dailyBase = randInt(200_000, 8_000_000);
    for (let d = 0; d < 30; d++) {
      const gmv = dailyBase * (0.5 + rand());
      productMetricRows.push({
        id: uid(`pm-${p.id}`, d),
        productId: p.id,
        date: daysAgo(29 - d),
        gmv: Math.round(gmv),
        orders: Math.round(gmv / p.price),
        units: Math.round((gmv / p.price) * 1.3),
      });
    }
  });
  await prisma.productMetric.createMany({ data: productMetricRows });

  // 5. Campaigns + creator/product links
  const campaignStatuses = [
    "Draft", "Planning", "Planning", "Planning", "Recruiting", "Recruiting",
    "Active", "Active", "Active", "Active", "Active", "ContentReview", "ContentReview",
    "Published", "Published", "Completed", "Completed", "Completed", "Completed", "Reporting",
  ];
  const campaigns: {
    id: string; brandId: string; name: string; ownerId: string; status: string;
    budget: number; gmvTarget: number; actualGmv: number; commissionRate: number;
  }[] = [];

  for (let i = 0; i < 20; i++) {
    const brand = BRANDS[i % BRANDS.length];
    const status = campaignStatuses[i];
    const budget = randInt(50_000_000, 500_000_000);
    const gmvTarget = Math.round(budget * (4 + rand() * 6));
    const done = ["Completed", "Reporting", "Published"].includes(status);
    const actualGmv = done ? Math.round(gmvTarget * (0.8 + rand() * 0.5)) : Math.round(gmvTarget * (0.1 + rand() * 0.5));
    campaigns.push({
      id: uid("campaign", i),
      brandId: brandIds[i % BRANDS.length],
      name: `${brand.name} ${pick(["Ramadan", "Launch", "Seasonal", "Awareness", "Flash Sale", "Harbolnas"])} Campaign`,
      ownerId: i % 2 === 0 ? "user-004" : "user-002",
      status,
      budget,
      gmvTarget,
      actualGmv,
      commissionRate: +(rand() * 15 + 5).toFixed(1),
    });
  }

  for (const c of campaigns) {
    await prisma.campaign.create({
      data: {
        id: c.id,
        agencyId: "agency-001",
        brandId: c.brandId,
        name: c.name,
        ownerId: c.ownerId,
        startDate: daysAgo(randInt(10, 60)),
        endDate: daysFromNow(randInt(5, 40)),
        budget: c.budget,
        creatorTarget: randInt(3, 12),
        contentTarget: randInt(5, 30),
        liveTarget: randInt(1, 8),
        gmvTarget: c.gmvTarget,
        actualGmv: c.actualGmv,
        commissionRate: c.commissionRate,
        status: c.status,
        externalId: `tiktok-camp-${c.id}`,
      },
    });
  }

  const campaignCreatorRows: { id: string; campaignId: string; creatorId: string; fee: number; gmvContribution: number }[] = [];
  const campaignProductRows: { id: string; campaignId: string; productId: string }[] = [];
  let ccIdx = 0;
  let cpIdx = 0;
  campaigns.forEach((c, ci) => {
    const creatorCount = randInt(3, 8);
    for (let k = 0; k < creatorCount; k++) {
      const creator = creators[(ci * 7 + k * 13) % creators.length];
      campaignCreatorRows.push({
        id: uid("cc", ccIdx++),
        campaignId: c.id,
        creatorId: creator.id,
        fee: randInt(1_000_000, 30_000_000),
        gmvContribution: Math.round(c.actualGmv / creatorCount),
      });
    }
    const productCount = randInt(2, 4);
    for (let k = 0; k < productCount; k++) {
      const product = products[(ci * 5 + k) % products.length];
      campaignProductRows.push({
        id: uid("cp", cpIdx++),
        campaignId: c.id,
        productId: product.id,
      });
    }
  });
  await prisma.campaignCreator.createMany({ data: campaignCreatorRows });
  await prisma.campaignProduct.createMany({ data: campaignProductRows });

  // 6. Content items
  const contentStatuses: string[] = [];
  const contentStatusWeights: [string, number][] = [
    ["Brief", 25], ["Assigned", 20], ["WaitingForDraft", 15], ["DraftSubmitted", 30],
    ["Revision", 25], ["Approved", 20], ["Scheduled", 10], ["Published", 45],
    ["Rejected", 6], ["Cancelled", 4],
  ];
  contentStatusWeights.forEach(([s, w]) => {
    for (let i = 0; i < w; i++) contentStatuses.push(s);
  });

  const contentRows: {
    id: string; agencyId: string; campaignId: string; creatorId: string; productId: string;
    title: string; brief: string; dueDate: Date; publishDate: Date | null; status: string;
    revisionCount: number; reviewerId: string | null; gmvGenerated: number; viewsGenerated: number;
  }[] = [];

  const reviewers = ["user-002", "user-004"];
  for (let i = 0; i < 200; i++) {
    const campaign = campaigns[i % campaigns.length];
    const creator = creators[(i * 3) % creators.length];
    const product = products[(i * 5) % products.length];
    const status = contentStatuses[i % contentStatuses.length];
    const published = status === "Published" || status === "Scheduled";
    const overdue = !published && i % 7 === 0;
    const revisionCount = status === "Revision" ? randInt(1, 3) : status === "Rejected" ? randInt(1, 2) : 0;
    contentRows.push({
      id: uid("content", i),
      agencyId: "agency-001",
      campaignId: campaign.id,
      creatorId: creator.id,
      productId: product.id,
      title: `${product.name} — Review ${creator.username}`,
      brief: `Konten fokus pada benefit ${product.name} untuk audiens ${creator.category}.`,
      dueDate: overdue ? daysAgo(randInt(1, 5)) : daysFromNow(randInt(0, 10)),
      publishDate: published ? daysAgo(randInt(0, 14)) : null,
      status,
      revisionCount,
      reviewerId: status === "DraftSubmitted" || status === "Revision" ? pick(reviewers) : null,
      gmvGenerated: published ? randInt(2_000_000, 80_000_000) : 0,
      viewsGenerated: published ? randInt(5_000, 2_000_000) : 0,
    });
  }
  await prisma.contentItem.createMany({ data: contentRows });

  const revisionRows: { id: string; contentItemId: string; version: number; feedback: string }[] = [];
  contentRows.forEach((c) => {
    for (let v = 1; v <= c.revisionCount; v++) {
      revisionRows.push({
        id: uid(`rev-${c.id}`, v - 1),
        contentItemId: c.id,
        version: v,
        feedback: `Revisi ${v}: sesuaikan hook dan CTA, tambah close-up produk.`,
      });
    }
  });
  await prisma.contentRevision.createMany({ data: revisionRows });

  // 7. LIVE sessions
  const liveStatuses: string[] = [];
  [
    ["Scheduled", 8], ["Preparing", 3], ["Live", 2], ["Ended", 15], ["Cancelled", 1], ["NeedsReview", 1],
  ].forEach(([s, w]) => {
    for (let i = 0; i < (w as number); i++) liveStatuses.push(s as string);
  });

  const liveRows: {
    id: string; agencyId: string; campaignId: string | null; creatorId: string; brandId: string;
    productId: string; room: string; operatorId: string | null; startTime: Date; endTime: Date | null;
    targetGmv: number; actualGmv: number; viewers: number; orders: number; status: string;
  }[] = [];

  for (let i = 0; i < 30; i++) {
    const creator = creators[(i * 5 + 3) % creators.length];
    const product = products[(i * 3) % products.length];
    const brandId = product.brandId;
    const status = liveStatuses[i % liveStatuses.length];
    const isPast = ["Ended", "Cancelled", "NeedsReview"].includes(status);
    const targetGmv = randInt(5_000_000, 100_000_000);
    const underperforming = i % 5 === 0;
    const actualGmv = isPast
      ? underperforming
        ? Math.round(targetGmv * (0.2 + rand() * 0.4))
        : Math.round(targetGmv * (0.8 + rand() * 0.8))
      : 0;
    const viewers = isPast ? randInt(1_000, 250_000) : status === "Live" ? randInt(2_000, 80_000) : 0;
    liveRows.push({
      id: uid("live", i),
      agencyId: "agency-001",
      campaignId: i % 3 === 0 ? campaigns[i % campaigns.length].id : null,
      creatorId: creator.id,
      brandId,
      productId: product.id,
      room: `Studio ${randInt(1, 5)}`,
      operatorId: isPast ? pick(["user-003", "user-004"]) : null,
      startTime: isPast ? daysAgo(randInt(1, 14)) : daysFromNow(randInt(0, 6)),
      endTime: isPast ? daysAgo(randInt(0, 13)) : null,
      targetGmv,
      actualGmv,
      viewers,
      orders: isPast ? Math.round(actualGmv / product.price) : 0,
      status,
    });
  }
  await prisma.liveSession.createMany({ data: liveRows });

  // 8. Finance: commissions, payouts, settlements
  const commissionRows: {
    id: string; agencyId: string; campaignId: string | null; creatorId: string;
    sourceType: string; sourceId: string | null; gmv: number; creatorRate: number;
    creatorCommission: number; agencyShareRate: number; agencyRevenue: number; status: string;
  }[] = [];

  for (let i = 0; i < 300; i++) {
    const creator = creators[(i * 7) % creators.length];
    const campaign = campaigns[(i * 3) % campaigns.length];
    const gmv = randInt(500_000, 150_000_000);
    const creatorRate = randInt(5, 20);
    const agencyShareRate = randInt(15, 40);
    const creatorCommission = calculateCreatorCommission(gmv, creatorRate);
    // PLAN §12: revenue agensi dihitung dari komisi creator, bukan dari GMV
    const agencyRevenue = calculateAgencyRevenue(creatorCommission, agencyShareRate);
    commissionRows.push({
      id: uid("comm", i),
      agencyId: "agency-001",
      campaignId: campaign.id,
      creatorId: creator.id,
      sourceType: pick(["LiveSession", "Content", "Campaign"]),
      sourceId: null,
      gmv,
      creatorRate,
      creatorCommission,
      agencyShareRate,
      agencyRevenue,
      status: pick(["Pending", "Calculated", "Calculated", "Settled"]),
    });
  }
  await prisma.commission.createMany({ data: commissionRows });

  const payoutRows: { id: string; agencyId: string; creatorId: string; campaignId: string | null; amount: number; status: string; paidAt: Date | null }[] = [];
  for (let i = 0; i < 50; i++) {
    const creator = creators[(i * 11) % creators.length];
    const paid = i % 3 !== 0;
    payoutRows.push({
      id: uid("payout", i),
      agencyId: "agency-001",
      creatorId: creator.id,
      campaignId: i % 2 === 0 ? campaigns[i % campaigns.length].id : null,
      amount: randInt(500_000, 40_000_000),
      status: paid ? "Paid" : "Pending",
      paidAt: paid ? daysAgo(randInt(1, 20)) : null,
    });
  }
  await prisma.creatorPayout.createMany({ data: payoutRows });

  const settlementRows: { id: string; agencyId: string; brandId: string; campaignId: string | null; amount: number; status: string; dueDate: Date; paidAt: Date | null }[] = [];
  for (let i = 0; i < 20; i++) {
    const brandId = brandIds[i];
    let status: string;
    let paidAt: Date | null = null;
    if (i < 4) { status = "Pending"; }
    else if (i < 6) { status = "Overdue"; }
    else { status = "Paid"; paidAt = daysAgo(randInt(2, 30)); }
    settlementRows.push({
      id: uid("settle", i),
      agencyId: "agency-001",
      brandId,
      campaignId: campaigns[i].id,
      amount: randInt(20_000_000, 400_000_000),
      status,
      dueDate: daysFromNow(randInt(-10, 14)),
      paidAt,
    });
  }
  await prisma.settlement.createMany({ data: settlementRows });

  // 9. Tasks + activities + notes
  const taskRows: {
    id: string; agencyId: string; title: string; ownerId: string; relatedType: string;
    relatedId: string | null; priority: string; dueDate: Date | null; status: string;
    createdById: string; completedById: string | null; completedAt: Date | null;
  }[] = [];

  const relatedTypes = ["Creator", "Campaign", "Content", "LiveSession", "Brand", "Finance", "Generic"];
  for (let i = 0; i < 250; i++) {
    const rt = relatedTypes[i % relatedTypes.length];
    const status = i % 4 === 0 ? "Done" : i % 5 === 0 ? "InProgress" : i % 11 === 0 ? "Cancelled" : "Open";
    const overdue = status === "Open" || status === "InProgress" ? i % 6 === 0 : false;
    taskRows.push({
      id: uid("task", i),
      agencyId: "agency-001",
      title: pick(TASK_TITLES),
      ownerId: ["user-002", "user-003", "user-004", "user-005"][i % 4],
      relatedType: rt,
      relatedId: rt === "Creator" ? creators[i % creators.length].id : rt === "Campaign" ? campaigns[i % campaigns.length].id : rt === "Content" ? contentRows[i % contentRows.length].id : rt === "LiveSession" ? liveRows[i % liveRows.length].id : rt === "Brand" ? brandIds[i % brandIds.length] : null,
      priority: pick(["Low", "Medium", "Medium", "High", "Urgent"]),
      dueDate: overdue ? daysAgo(randInt(1, 4)) : daysFromNow(randInt(0, 14)),
      status,
      createdById: pick(["user-001", "user-002", "user-004"]),
      completedById: status === "Done" ? ["user-002", "user-003", "user-004", "user-005"][i % 4] : null,
      completedAt: status === "Done" ? daysAgo(randInt(0, 7)) : null,
    });
  }
  await prisma.task.createMany({ data: taskRows });

  const activityRows: { id: string; agencyId: string; entityType: string; entityId: string; actorId: string; action: string; details: string | null; createdAt: Date }[] = [];
  for (let i = 0; i < 250; i++) {
    const et = relatedTypes[i % relatedTypes.length];
    const actorId = ["user-001", "user-002", "user-003", "user-004", "user-005"][i % 5];
    activityRows.push({
      id: uid("activity", i),
      agencyId: "agency-001",
      entityType: et,
      entityId: et === "Creator" ? creators[i % creators.length].id : et === "Campaign" ? campaigns[i % campaigns.length].id : et === "Content" ? contentRows[i % contentRows.length].id : et === "LiveSession" ? liveRows[i % liveRows.length].id : et === "Brand" ? brandIds[i % brandIds.length] : "generic",
      actorId,
      action: pick(ACTIVITY_ACTIONS),
      details: null,
      createdAt: daysAgo(randInt(0, 30), randInt(8, 20)),
    });
  }
  await prisma.activity.createMany({ data: activityRows });

  const noteRows: { id: string; agencyId: string; entityType: string; entityId: string; authorId: string; content: string; createdAt: Date }[] = [];
  for (let i = 0; i < 30; i++) {
    noteRows.push({
      id: uid("note", i),
      agencyId: "agency-001",
      entityType: "Creator",
      entityId: creators[i % creators.length].id,
      authorId: ["user-002", "user-003"][i % 2],
      content: pick([
        "Respon cepat dan konten berkualitas.",
        "Perlu follow-up soal jadwal LIVE.",
        "Rate sudah disepakati, tinggal kontrak.",
        "Performance bulan ini naik signifikan.",
        "Ada potensi kolaborasi jangka panjang.",
      ]),
      createdAt: daysAgo(randInt(0, 20)),
    });
  }
  await prisma.note.createMany({ data: noteRows });

  // 10. Integration (mock TikTok)
  await prisma.integration.create({
    data: {
      id: "integration-001",
      agencyId: "agency-001",
      provider: "TikTok",
      status: "Disconnected",
    },
  });

  const counts = {
    agencies: await prisma.agency.count(),
    users: await prisma.user.count(),
    brands: await prisma.brand.count(),
    creators: await prisma.creator.count(),
    creatorMetrics: await prisma.creatorMetric.count(),
    products: await prisma.product.count(),
    campaigns: await prisma.campaign.count(),
    contentItems: await prisma.contentItem.count(),
    liveSessions: await prisma.liveSession.count(),
    commissions: await prisma.commission.count(),
    payouts: await prisma.creatorPayout.count(),
    settlements: await prisma.settlement.count(),
    tasks: await prisma.task.count(),
    activities: await prisma.activity.count(),
  };

  console.log("Seed complete:");
  console.table(counts);
  console.log("\nLogin (demo):");
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email}  /  password123`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
