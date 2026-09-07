import { describe, expect, it } from "vitest";
import { can, readableResources } from "@/lib/authorization";
import { calculateCommission } from "@/lib/finance";

describe("financial domain", () => {
  it("keeps commission breakdown balanced and integer-safe", () => {
    const result = calculateCommission({
      gmv: 1_234_567,
      creatorRate: 7.5,
      agencyShareRate: 30,
    });
    expect(result.agencyRevenue + result.creatorPayout).toBe(
      result.creatorCommission,
    );
    expect(Number.isInteger(result.creatorCommission)).toBe(true);
  });
});

describe("authorization domain", () => {
  it("limits viewer access to readable resources", () => {
    expect(can("viewer", "report", "read")).toBe(true);
    expect(can("viewer", "finance", "write")).toBe(false);
    expect(readableResources("viewer")).toContain("report");
  });
});
