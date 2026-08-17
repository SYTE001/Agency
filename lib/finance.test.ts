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

// Revisi §2 — required coverage: nominal 0, 1, 0.1, 999.99, large values,
// commission percentages, creator payout, agency revenue, settlement balance.
describe("monetary coverage (Revisi §2)", () => {
  it("handles the mandated edge nominals", () => {
    assert.equal(calculateCreatorCommission(0, 10), 0);
    assert.equal(calculateCreatorCommission(1, 10), 0); // 0.1 → rounds to 0
    assert.equal(calculateCreatorCommission(0.1, 10), 0); // 0.01 → rounds to 0
    assert.equal(calculateCreatorCommission(999.99, 10), 100); // 99.999 → 100
    // large nominal stays exact — whole Rupiah well under 2^53
    assert.equal(calculateCreatorCommission(12_500_000_000, 10), 1_250_000_000);
  });

  it("handles the mandated commission percentages", () => {
    const r5 = calculateCommission({ gmv: 1_000_000, creatorRate: 5, agencyShareRate: 20 });
    assert.equal(r5.creatorCommission, 50_000);
    assert.equal(r5.agencyRevenue, 10_000);
    assert.equal(r5.creatorPayout, 40_000);

    const r15 = calculateCommission({ gmv: 1_000_000, creatorRate: 15.5, agencyShareRate: 25 });
    assert.equal(r15.creatorCommission, 155_000);
    assert.equal(r15.agencyRevenue, 38_750);
    assert.equal(r15.creatorPayout, 116_250);
  });

  it("never produces floating-point artifacts (0.1 + 0.2 class errors)", () => {
    // 999_999 * 7% = 69999.93 → 70000, exact whole Rupiah
    const r = calculateCommission({ gmv: 999_999, creatorRate: 7, agencyShareRate: 33 });
    assert.equal(r.creatorCommission, 70_000);
    assert.equal(r.agencyRevenue, 23_100);
    assert.equal(r.creatorPayout, 46_900);
    assert.equal(r.agencyRevenue + r.creatorPayout, r.creatorCommission);
    assert.ok(Number.isInteger(r.creatorCommission));
    assert.ok(Number.isInteger(r.agencyRevenue));
    assert.ok(Number.isInteger(r.creatorPayout));
  });

  it("keeps settlement-style totals consistent across many values", () => {
    // The payout + agency revenue must always equal the gross commission,
    // which is what settlement reconciliation depends on.
    const gmvs = [0, 1, 999.99, 12_345, 999_999, 1_000_000, 4_875_250, 12_500_000_000];
    const rates = [0, 1, 5, 7.5, 10, 12, 15.5, 20];
    const shares = [0, 10, 20, 25, 30, 33.33, 50];
    for (const gmv of gmvs) {
      for (const creatorRate of rates) {
        for (const agencyShareRate of shares) {
          const r = calculateCommission({ gmv, creatorRate, agencyShareRate });
          assert.equal(
            r.agencyRevenue + r.creatorPayout,
            r.creatorCommission,
            `unbalanced for gmv=${gmv} rate=${creatorRate} share=${agencyShareRate}`,
          );
          assert.ok(Number.isInteger(r.creatorCommission));
          assert.ok(Number.isInteger(r.agencyRevenue));
          assert.ok(Number.isInteger(r.creatorPayout));
        }
      }
    }
  });
});
