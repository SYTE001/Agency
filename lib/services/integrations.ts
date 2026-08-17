import prisma from "@/lib/prisma";
import { CREATOR_CATEGORIES } from "@/lib/constants";

/**
 * Integration layer (PLAN §19/§20 + Phase 7). The UI never talks to TikTok
 * directly; everything flows through this layer. What the MVP ships:
 *  - external IDs on creators/brands/products/campaigns (duplicate detection)
 *  - CSV import (semicolon format, same as our CSV export)
 *  - sync jobs + sync logs, persisted per Integration row
 *  - a mock TikTok provider that produces realistic-looking data
 * OAuth/partner sync is deliberately NOT in the MVP (PLAN §28).
 */

// ---------------------------------------------------------------------------
// CSV parsing — semicolon-separated with quoted fields (id-ID Excel format)
// ---------------------------------------------------------------------------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^﻿/, ""); // strip BOM if present
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ";") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

// ---------------------------------------------------------------------------
// CSV import — creators & products. Upsert by externalId when present, then
// by username/name within the agency. Rows are validated first; one bad row
// rejects the file so partial data never sneaks in.
// ---------------------------------------------------------------------------

export type ImportResult = {
  created: number;
  updated: number;
  rows: number;
};

export type ImportError = { error: string };

function splitHeader(headers: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((h, i) => {
    out[h.trim().toLowerCase()] = (row[i] ?? "").trim();
  });
  return out;
}

function toInt(v: string | undefined): number {
  if (!v) return 0;
  const n = Number.parseInt(v.replace(/[.,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function importCreatorsCsv(
  agencyId: string,
  text: string,
): Promise<ImportResult | ImportError> {
  const rows = parseCsv(text);
  if (rows.length < 2) return { error: "File CSV kosong atau tidak punya baris data." };
  const headers = rows[0];
  const data = rows.slice(1).map((r) => splitHeader(headers, r));

  // Validate every row before writing anything. NB: splitHeader lowercases
  // the keys, so lookups must use lowercase too (displayName -> displayname).
  const invalid: string[] = [];
  data.forEach((r, i) => {
    if (!r.username || r.username.length < 3) invalid.push(`Baris ${i + 2}: username kosong atau < 3 karakter`);
    if (!r.displayname || r.displayname.length < 2) invalid.push(`Baris ${i + 2}: nama kosong atau < 2 karakter`);
    if (!r.category) invalid.push(`Baris ${i + 2}: kategori kosong`);
    if (r.category && !(CREATOR_CATEGORIES as readonly string[]).includes(r.category)) {
      invalid.push(`Baris ${i + 2}: kategori "${r.category}" tidak dikenal`);
    }
  });
  if (invalid.length > 0) {
    return { error: invalid.slice(0, 5).join("; ") };
  }

  let created = 0;
  let updated = 0;
  for (const r of data) {
    const externalId = r.externalid || null;
    const existing = await prisma.creator.findFirst({
      where: {
        agencyId,
        OR: externalId
          ? [{ externalId }, { username: r.username }]
          : [{ username: r.username }],
      },
    });
    const payload = {
      username: r.username,
      displayName: r.displayname,
      category: r.category,
      followers: toInt(r.followers),
      engagementRate: r.engagementrate ? Number.parseFloat(r.engagementrate.replace(",", ".")) || 0 : 0,
      externalId,
    };
    if (existing) {
      await prisma.creator.update({ where: { id: existing.id }, data: payload });
      updated++;
    } else {
      await prisma.creator.create({ data: { agencyId, ...payload } });
      created++;
    }
  }
  return { created, updated, rows: data.length };
}

export async function importProductsCsv(
  agencyId: string,
  text: string,
): Promise<ImportResult | ImportError> {
  const rows = parseCsv(text);
  if (rows.length < 2) return { error: "File CSV kosong atau tidak punya baris data." };
  const headers = rows[0];
  const data = rows.slice(1).map((r) => splitHeader(headers, r));

  // Brand names are matched per agency; unknown brands are created on the fly
  // so an import file can bootstrap a new tenant in one step.
  const brandCache = new Map<string, string>();
  async function resolveBrand(name: string): Promise<string> {
    const key = name.trim().toLowerCase();
    if (brandCache.has(key)) return brandCache.get(key)!;
    let brand = await prisma.brand.findFirst({ where: { agencyId, name: { equals: name.trim() } } });
    if (!brand) {
      brand = await prisma.brand.create({ data: { agencyId, name: name.trim() } });
    }
    brandCache.set(key, brand.id);
    return brand.id;
  }

  const invalid: string[] = [];
  data.forEach((r, i) => {
    if (!r.name) invalid.push(`Baris ${i + 2}: nama produk kosong`);
    if (!r.brand) invalid.push(`Baris ${i + 2}: brand kosong`);
  });
  if (invalid.length > 0) {
    return { error: invalid.slice(0, 5).join("; ") };
  }

  let created = 0;
  let updated = 0;
  for (const r of data) {
    const brandId = await resolveBrand(r.brand);
    const externalId = r.externalid || null;
    const existing = await prisma.product.findFirst({
      where: {
        agencyId,
        OR: externalId ? [{ externalId }, { name: r.name }] : [{ name: r.name }],
      },
    });
    const payload = {
      name: r.name,
      brandId,
      sku: r.sku || null,
      category: r.category || null,
      price: r.price ? Number.parseFloat(r.price.replace(/[.,\s]/g, "")) || 0 : 0,
      externalId,
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: payload });
      updated++;
    } else {
      await prisma.product.create({ data: { agencyId, ...payload } });
      created++;
    }
  }
  return { created, updated, rows: data.length };
}

// ---------------------------------------------------------------------------
// Sync jobs — the MVP runs synchronously (no worker queue); a job is created
// per run, its status is persisted, and every step lands in sync_logs.
// Failed jobs keep their logs so retry logic (Phase 7) can re-run them.
// ---------------------------------------------------------------------------

const PROVIDER = "TikTok";

export async function getOrCreateIntegration(agencyId: string) {
  let integration = await prisma.integration.findFirst({ where: { agencyId } });
  if (!integration) {
    integration = await prisma.integration.create({
      data: { agencyId, provider: PROVIDER, status: "Disconnected" },
    });
  }
  return integration;
}

export type SyncOutcome = {
  jobId: string;
  status: "Success" | "Failed";
  logCount: number;
};

/**
 * Mock sync (PLAN §20 "Mock Data" first step). Simulates pulling recent
 * creator metrics from TikTok: for each synced creator (has externalId) we
 * upsert a metric row for today with plausible numbers, and bump each active
 * campaign's actualGmv a little — so the dashboard visibly reacts.
 */
export async function runMockSync(agencyId: string): Promise<SyncOutcome> {
  const integration = await getOrCreateIntegration(agencyId);
  const job = await prisma.syncJob.create({
    data: { integrationId: integration.id, type: "mock_pull", status: "Running", startedAt: new Date() },
  });
  const logs: { level: string; message: string }[] = [];
  const log = (level: "info" | "warn" | "error", message: string) => logs.push({ level, message });

  try {
    await prisma.integration.update({ where: { id: integration.id }, data: { status: "Connected" } });
    log("info", `Terhubung ke provider ${PROVIDER} (mode mock)`);

    const creators = await prisma.creator.findMany({
      where: { agencyId, externalId: { not: null }, status: "Active" },
      select: { id: true, displayName: true, externalId: true, followers: true, engagementRate: true },
    });
    if (creators.length === 0) {
      log("warn", "Tidak ada creator dengan externalId — jalankan import CSV dulu atau isi externalId");
    }

    const today = new Date();
    let metricCount = 0;
    for (const c of creators) {
      // Deterministic pseudo-random from the externalId so re-runs differ a little
      const seed = [...(c.externalId ?? c.id)].reduce((a, ch) => a + ch.charCodeAt(0), 0);
      const jitter = ((seed + today.getDate()) % 20) / 100; // 0..0.19
      const gmv = Math.round(c.followers * (200 + seed % 300) * (1 + jitter));
      const videos = 1 + (seed % 3);
      const liveGmv = seed % 2 === 0 ? Math.round(gmv * 0.4) : 0;
      await prisma.creatorMetric.create({
        data: {
          creatorId: c.id,
          date: today,
          followers: c.followers + Math.round(c.followers * jitter * 0.1),
          engagementRate: Math.min(20, c.engagementRate + jitter * 2),
          gmv,
          videos,
          avgViews: Math.round(c.followers * (0.05 + jitter)),
          liveGmv,
        },
      });
      metricCount++;
      log("info", `Metrik ${c.displayName} (${c.externalId}) — GMV ${gmv}, ${videos} video`);
    }

    const campaigns = await prisma.campaign.findMany({
      where: { agencyId, status: "Active" },
      select: { id: true, name: true, actualGmv: true },
    });
    for (const c of campaigns) {
      const bump = Math.round(500_000 + Math.random() * 2_000_000);
      await prisma.campaign.update({
        where: { id: c.id },
        data: { actualGmv: c.actualGmv.toNumber() + bump },
      });
      log("info", `Campaign ${c.name} — GMV bertambah ${bump}`);
    }

    log("info", `Selesai: ${metricCount} metrik creator, ${campaigns.length} campaign diperbarui`);
    await prisma.syncLog.createMany({ data: logs.map((l) => ({ syncJobId: job.id, ...l })) });
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "Success", finishedAt: new Date() },
    });
    return { jobId: job.id, status: "Success", logCount: logs.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("error", `Sync gagal: ${message}`);
    await prisma.syncLog.createMany({ data: logs.map((l) => ({ syncJobId: job.id, ...l })) });
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "Failed", finishedAt: new Date() },
    });
    return { jobId: job.id, status: "Failed", logCount: logs.length };
  }
}

/** Latest sync jobs for the agency, newest first. Logs are capped at 50 per
 * job — taken newest-first (so the completion summary survives), then flipped
 * back to chronological for display. Sorts by id, not createdAt: a batch of
 * logs lands in one createMany, so their timestamps are identical and the
 * ordering would be undefined. */
export async function listSyncJobs(agencyId: string, take = 10) {
  const integration = await getOrCreateIntegration(agencyId);
  const jobs = await prisma.syncJob.findMany({
    where: { integrationId: integration.id },
    orderBy: { createdAt: "desc" },
    take,
    include: { logs: { orderBy: { id: "desc" }, take: 50 } },
  });
  return jobs.map((j) => ({ ...j, logs: [...j.logs].reverse() }));
}

export type SyncJobWithLogs = Awaited<ReturnType<typeof listSyncJobs>>[number];
