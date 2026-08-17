// Commission & revenue calculation helpers (PLAN §12).
//
// All monetary values are whole Rupiah (IDR has no subunit), so integer-safe
// number arithmetic with Math.round is exact for any realistic GMV — well
// under 2^53. Prisma Decimal values must be converted with Number()/toNumber()
// at the service read boundary before being passed here.

export interface CommissionBreakdown {
  gmv: number;
  creatorRate: number;
  agencyShareRate: number;
  creatorCommission: number;
  agencyRevenue: number;
  creatorPayout: number;
  creatorShare: number;
}

/** Komisi kotor kreator: GMV × creatorRate% (dibulatkan ke Rupiah utuh). */
export function calculateCreatorCommission(gmv: number, creatorRate: number): number {
  return Math.round((gmv * creatorRate) / 100);
}

/** Bagian agency: creatorCommission × agencyShareRate% (PLAN §12 — berbasis komisi, BUKAN GMV). */
export function calculateAgencyRevenue(creatorCommission: number, agencyShareRate: number): number {
  return Math.round((creatorCommission * agencyShareRate) / 100);
}

/** Komisi bersih yang dibayarkan ke kreator: creatorCommission − agencyRevenue. */
export function calculateCreatorPayout(creatorCommission: number, agencyRevenue: number): number {
  return creatorCommission - agencyRevenue;
}

/** Hitung seluruh breakdown komisi sekali jalan; dijamin konsisten internal. */
export function calculateCommission(input: {
  gmv: number;
  creatorRate: number;
  agencyShareRate: number;
}): CommissionBreakdown {
  const gmv = Math.round(input.gmv);
  const creatorCommission = calculateCreatorCommission(gmv, input.creatorRate);
  const agencyRevenue = calculateAgencyRevenue(creatorCommission, input.agencyShareRate);
  const creatorPayout = calculateCreatorPayout(creatorCommission, agencyRevenue);

  return {
    gmv,
    creatorRate: input.creatorRate,
    agencyShareRate: input.agencyShareRate,
    creatorCommission,
    agencyRevenue,
    creatorPayout,
    creatorShare: creatorPayout,
  };
}
