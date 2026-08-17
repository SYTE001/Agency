import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAgencyRevenue,
  calculateCommission,
  calculateCreatorCommission,
  calculateCreatorPayout,
} from "./finance";

// Financial calculations must be deterministic, use consistent rounding, and
// match the PLAN §12 formula everywhere. These lock the exact rounding behavior.

describe("calculateCreatorCommission", () => {
  it("computes GMV * rate / 100", () => {
    assert.equal(calculateCreatorCommission(1_000_000, 10), 100_000);
  });

  it("rounds fractional Rupiah to a whole number", () => {
    // 999_999 * 10% = 99999.9 → 100000
    assert.equal(calculateCreatorCommission(999_999, 10), 100_000);
  });

  it("returns 0 for a zero GMV", () => {
    assert.equal(calculateCreatorCommission(0, 10), 0);
  });
});

describe("calculateAgencyRevenue", () => {
  it("is computed from creator commission, NOT from GMV (PLAN §12)", () => {
    // creatorCommission = 100_000; agency share 30% → 30_000
    assert.equal(calculateAgencyRevenue(100_000, 30), 30_000);
  });

  it("rounds to whole Rupiah", () => {
    // 99_999 * 30% = 29999.7 → 30000
    assert.equal(calculateAgencyRevenue(99_999, 30), 30_000);
  });
});

describe("calculateCreatorPayout", () => {
  it("is creatorCommission minus agencyRevenue", () => {
    assert.equal(calculateCreatorPayout(100_000, 30_000), 70_000);
  });
});

describe("calculateCommission", () => {
  it("produces a consistent, internally-balanced breakdown", () => {
    const r = calculateCommission({ gmv: 100_000_000, creatorRate: 12, agencyShareRate: 30 });
    assert.equal(r.creatorCommission, 12_000_000);
    assert.equal(r.agencyRevenue, 3_600_000);
    assert.equal(r.creatorPayout, 8_400_000);
    // the sums balance exactly
    assert.equal(r.agencyRevenue + r.creatorPayout, r.creatorCommission);
    assert.equal(r.creatorShare, r.creatorPayout);
  });

  it("is deterministic across repeated calls", () => {
    const a = calculateCommission({ gmv: 1_234_567, creatorRate: 7, agencyShareRate: 22 });
    const b = calculateCommission({ gmv: 1_234_567, creatorRate: 7, agencyShareRate: 22 });
    assert.deepEqual(a, b);
  });

  it("handles zero agency share", () => {
    const r = calculateCommission({ gmv: 50_000_000, creatorRate: 10, agencyShareRate: 0 });
    assert.equal(r.agencyRevenue, 0);
    assert.equal(r.creatorPayout, r.creatorCommission);
  });
});
