export interface CommissionBreakdown {
  gmv: number;
  creatorRate: number;
  agencyShareRate: number;
  creatorCommission: number;
  agencyRevenue: number;
  creatorPayout: number;
  creatorShare: number;
}

export function calculateCreatorCommission(gmv: number, creatorRate: number): number {
  return Math.round((gmv * creatorRate) / 100);
}

export function calculateAgencyRevenue(creatorCommission: number, agencyShareRate: number): number {
  return Math.round((creatorCommission * agencyShareRate) / 100);
}

export function calculateCreatorPayout(creatorCommission: number, agencyRevenue: number): number {
  return creatorCommission - agencyRevenue;
}


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
