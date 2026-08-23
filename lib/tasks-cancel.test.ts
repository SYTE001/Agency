// Focused tests for the task Cancelled workflow (Phase 3 P0 #3).
//
// The schema/constants always allowed Cancelled, but nothing reached it: no
// UI action offered the transition and updateTask accepted it from any state
// (e.g. Done → Cancelled). These tests pin the completed workflow:
//   - cancelling works from Open/InProgress and nowhere else
//   - the mutation stays tenant-scoped and rejects unknown ids
//   - only task:write roles can reach it (the action's RBAC gate)
//   - cancelled work leaves active/overdue logic immediately
//   - cancelled status survives reads, filters, and unrelated edits
//
// Runs against a throwaway database (see lib/test-env.ts), never prisma/dev.db.

import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import prisma from "@/lib/prisma";
import { getTaskCounts, listTasks, updateTask } from "@/lib/services/tasks";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";
import { can } from "@/lib/authorization";
import { ROLES } from "@/lib/constants";

const AGENCY_A = "tz-cancel-agency-a";
const AGENCY_B = "tz-cancel-agency-b";
const PAST = new Date(Date.now() - 60 * 60_000); // due an hour ago → overdue

before(async () => {
  if (!PROVIDED_DATABASE_URL) {
    // Apply the committed SQLite migration history to the throwaway file
    // (same bootstrap as lib/mock-sync.test.ts).
    execFileSync(
      process.execPath,
      [
        path.join("node_modules", "prisma", "build", "index.js"),
        "migrate",
        "deploy",
        "--schema",
        path.join("prisma", "schema.sqlite.prisma"),
      ],
      { cwd: path.resolve(__dirname, ".."), stdio: "pipe" },
    );
  }
  await prisma.agency.createMany({
    data: [
      { id: AGENCY_A, name: "Cancel Agency A", slug: AGENCY_A },
      { id: AGENCY_B, name: "Cancel Agency B", slug: AGENCY_B },
    ],
  });
});

after(async () => {
  await prisma.$disconnect();
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

function seedTask(
  agencyId: string,
  title: string,
  data: { status?: string; dueDate?: Date | null } = {},
) {
  return prisma.task.create({
    data: {
      agencyId,
      title,
      status: data.status ?? "Open",
      dueDate: data.dueDate ?? null,
    },
  });
}

describe("task cancel workflow (Phase 3 P0 #3)", () => {
  it("an authorized user cancels an Open task", async () => {
    const t = await seedTask(AGENCY_A, "Batalkan saya", { dueDate: PAST });
    const updated = await updateTask(AGENCY_A, t.id, "actor-1", { status: "Cancelled" });
    assert.equal(updated.status, "Cancelled");
    assert.equal(updated.completedAt, null, "cancelling must not look like completion");

    const reread = await prisma.task.findUnique({ where: { id: t.id } });
    assert.equal(reread!.status, "Cancelled");
  });

  it("an InProgress task can be cancelled as well", async () => {
    const t = await seedTask(AGENCY_A, "Dikerjakan lalu batal", {
      status: "InProgress",
      dueDate: PAST,
    });
    const updated = await updateTask(AGENCY_A, t.id, "actor-1", { status: "Cancelled" });
    assert.equal(updated.status, "Cancelled");
  });

  it("cancelling is rejected from ineligible states", async () => {
    // Done must be reopened first…
    const done = await seedTask(AGENCY_A, "Sudah selesai dulu", {
      status: "Done",
      dueDate: PAST,
      });
    await assert.rejects(
      updateTask(AGENCY_A, done.id, "actor-1", { status: "Cancelled" }),
      /Open atau InProgress/,
    );
    // …and Cancelled itself is terminal — no double-cancel.
    const cancelled = await seedTask(AGENCY_A, "Sudah dibatalkan", { status: "Cancelled" });
    await assert.rejects(
      updateTask(AGENCY_A, cancelled.id, "actor-1", { status: "Cancelled" }),
      /Open atau InProgress/,
    );
  });

  it("invalid status strings stay rejected", async () => {
    const t = await seedTask(AGENCY_A, "Status aneh");
    await assert.rejects(
      updateTask(AGENCY_A, t.id, "actor-1", { status: "Hacked" }),
      /Status tidak valid/,
    );
  });

  it("a nonexistent task cannot be cancelled", async () => {
    await assert.rejects(
      updateTask(AGENCY_A, "no-such-task", "actor-1", { status: "Cancelled" }),
      /tidak ditemukan/,
    );
  });

  it("cross-tenant cancel is rejected", async () => {
    const tA = await seedTask(AGENCY_A, "Milik agensi A");
    // Agency B's context must not even resolve the task, let alone cancel it.
    await assert.rejects(
      updateTask(AGENCY_B, tA.id, "actor-1", { status: "Cancelled" }),
      /tidak ditemukan/,
    );
    assert.equal(
      await prisma.task.findFirst({ where: { id: tA.id, agencyId: AGENCY_B } }),
      null,
    );
  });

  it("cancelled task leaves active/overdue logic immediately", async () => {
    const late = await seedTask(AGENCY_A, "Terlambat lalu batal", { dueDate: PAST });

    const beforeCounts = await getTaskCounts(AGENCY_A);
    const beforeOverdue = await listTasks(AGENCY_A, { overdue: true });
    assert.ok(beforeCounts.overdue >= 1);
    assert.ok(beforeOverdue.items.some((x) => x.id === late.id), "must be overdue before cancelling");

    await updateTask(AGENCY_A, late.id, "actor-1", { status: "Cancelled" });

    const afterCounts = await getTaskCounts(AGENCY_A);
    assert.equal(afterCounts.overdue, beforeCounts.overdue - 1);
    assert.equal(afterCounts.open, beforeCounts.open - 1);
    assert.equal(afterCounts.cancelled, beforeCounts.cancelled + 1);

    const afterOverdue = await listTasks(AGENCY_A, { overdue: true });
    assert.ok(!afterOverdue.items.some((x) => x.id === late.id));
    // The page badge mirrors this rule: only Open/InProgress can look overdue.
    const row = await prisma.task.findUnique({ where: { id: late.id } });
    assert.ok(row!.status !== "Open" && row!.status !== "InProgress");
  });

  it("cancelled status is preserved in reads and filters", async () => {
    const t = await seedTask(AGENCY_A, "Terlihat sebagai dibatalkan", { status: "Cancelled" });

    const byStatus = await listTasks(AGENCY_A, { status: "Cancelled" });
    assert.ok(byStatus.items.some((x) => x.id === t.id), "status filter finds it");

    const all = await listTasks(AGENCY_A);
    const row = all.items.find((x) => x.id === t.id);
    assert.ok(row, "'Semua' listing still shows it");
    assert.equal(row!.status, "Cancelled");

    // An unrelated field edit must not resurrect or clear the status.
    await updateTask(AGENCY_A, t.id, "actor-1", { notes: "dicek kembali" });
    const reread = await prisma.task.findUnique({ where: { id: t.id } });
    assert.equal(reread!.notes, "dicek kembali");
    assert.equal(reread!.status, "Cancelled");
  });
});

describe("task write RBAC gate (updateTaskStatusAction's server-side check)", () => {
  it("only operational roles hold task:write", () => {
    const writers = [
      "owner",
      "admin",
      "account_manager",
      "creator_manager",
      "campaign_manager",
      "live_manager",
    ];
    for (const role of ROLES) {
      assert.equal(can(role, "task", "write"), writers.includes(role), `${role} task:write`);
    }
  });

  it("viewer and finance can read but never transition", () => {
    for (const role of ["viewer", "finance"] as const) {
      assert.equal(can(role, "task", "read"), true);
      assert.equal(can(role, "task", "write"), false, `${role} must not cancel tasks`);
    }
  });
});
