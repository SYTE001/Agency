// Focused tests for task overdue semantics (Phase 3 P0 #2).
//
// Overdue is deliberately an instant comparison (dueDate < now): whether a
// task is late must never depend on the server's runtime timezone nor on the
// tenant's Agency.timezone config — those only govern how timestamps are
// RENDERED. Day-boundary helpers stay out of the overdue path by design;
// these tests pin that contract end-to-end through the service layer.
//
// Runs against a throwaway database (see lib/test-env.ts), never prisma/dev.db.

import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import prisma from "@/lib/prisma";
import { getTaskCounts, listTasks } from "@/lib/services/tasks";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";
import { dayStartInTz } from "@/lib/timezone";

const AGENCY = "tz-overdue-agency";

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
  await prisma.agency.create({
    data: { id: AGENCY, name: "TZ Overdue Agency", slug: AGENCY },
  });
});

after(async () => {
  await prisma.$disconnect();
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

function seedTask(title: string, data: { status?: string; dueDate?: Date | null } = {}) {
  return prisma.task.create({
    data: {
      agencyId: AGENCY,
      title,
      status: data.status ?? "Open",
      dueDate: data.dueDate ?? null,
    },
  });
}

describe("task overdue calculation (instant-based)", () => {
  let overdueOpen: string;
  let overdueInProgress: string;

  before(async () => {
    const now = Date.now();
    const hour = 60 * 60_000;
    overdueOpen = (
      await seedTask("Terlambat open", { dueDate: new Date(now - hour) })
    ).id;
    overdueInProgress = (
      await seedTask("Terlambat dikerjakan", {
        status: "InProgress",
        dueDate: new Date(now - 25 * hour),
      })
    ).id;
    await seedTask("Masih jauh deadline-nya", { dueDate: new Date(now + 2 * hour) });
    await seedTask("Selesai telat tapi selesai", {
      status: "Done",
      dueDate: new Date(now - 48 * hour),
    });
    await seedTask("Tanpa deadline");
  });

  it("counts exactly the past-due Open/InProgress tasks", async () => {
    const counts = await getTaskCounts(AGENCY);
    assert.equal(counts.overdue, 2);
    assert.equal(counts.open, 3); // overdue one + upcoming + no-deadline
    assert.equal(counts.inProgress, 1);
    assert.equal(counts.done, 1);
  });

  it("the overdue list filter returns the same membership", async () => {
    const page = await listTasks(AGENCY, { overdue: true });
    assert.equal(page.total, 2);
    // Ordered by dueDate ascending: the 25h-old task first.
    assert.deepEqual(page.items.map((t) => t.id), [overdueInProgress, overdueOpen]);
  });

  it("changing the agency timezone does not move overdue boundaries", async () => {
    const before = await getTaskCounts(AGENCY);
    await prisma.agency.update({
      where: { id: AGENCY },
      data: { timezone: "Pacific/Honolulu" },
    });
    try {
      const after = await getTaskCounts(AGENCY);
      assert.equal(after.overdue, before.overdue, "lateness must not depend on Agency.timezone");
    } finally {
      await prisma.agency.update({
        where: { id: AGENCY },
        data: { timezone: "Asia/Jakarta" },
      });
    }
  });

  it("the tenant zone only moves where 'today' starts for display purposes", () => {
    const now = new Date();
    // Jakarta and Honolulu midnights are 17 hours apart — never the same instant.
    assert.notEqual(
      dayStartInTz("Asia/Jakarta", now).toISOString(),
      dayStartInTz("Pacific/Honolulu", now).toISOString(),
    );
  });
});
