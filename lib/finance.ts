// Deterministic financial calculations (PLAN §12).
//
// All monetary values are WHOLE Rupiah (IDR has no meaningful subunit in this
// product), and rates are whole-number percentages (12 = 12%). Derived amounts
// are rounded ONCE here via integer-safe Math.round, so the same formula and
// rounding are used everywhere — no duplicated formula in React components, no
// drifting across the codebase.
//
// NOTE ON PRECISION (Phase 4): the SQLite datasource stores these fields as
// Float (REAL). SQLite has no native Decimal type and better-sqlite3 adapters
// round-trip REAL as IEEE-754 doubles. Because every amount is already a whole
// number of Rupiah and far below Number.MAX_SAFE_INTEGER (2^53−1), float
// arithmetic on whole-Rupiah values is exact in practice. When the schema moves
// to PostgreSQL/Supabase, migrate these columns to DECIMAL(19,0) / the Prisma
// Decimal type; the call sites below stay unchanged because they operate on
// numbers. Do NOT introduce fractional-Rupiah values.

export type CommissionBreakdown = {
  creatorCommission: number;
  agencyRevenue: number;
  creatorPayout: number;
};

/** creatorCommission = gmv * creatorRate / 100 */
export function calculateCreatorCommission(gmv: number, creatorRate: number): number {
  return Math.round((gmv * creatorRate) / 100);
}

/** agencyRevenue = creatorCommission * agencyShareRate / 100 */
export function calculateAgencyRevenue(creatorCommission: number, agencyShareRate: number): number {
  return Math.round((creatorCommission * agencyShareRate) / 100);
}

/** creatorPayout = creatorCommission − agencyRevenue (the creator's take-home) */
export function calculateCreatorPayout(creatorCommission: number, agencyRevenue: number): number {
  return creatorCommission - agencyRevenue;
}

/**
 * Full breakdown from a GMV source. Returns `creatorShare` as an alias of
 * `creatorPayout` for call sites that predate the naming.
 */
export function calculateCommission(args: {
  gmv: number;
  creatorRate: number;
  agencyShareRate: number;
}): CommissionBreakdown & { creatorShare: number } {
  const creatorCommission = calculateCreatorCommission(args.gmv, args.creatorRate);
  const agencyRevenue = calculateAgencyRevenue(creatorCommission, args.agencyShareRate);
  const creatorPayout = calculateCreatorPayout(creatorCommission, agencyRevenue);
  return { creatorCommission, agencyRevenue, creatorPayout, creatorShare: creatorPayout };
}
