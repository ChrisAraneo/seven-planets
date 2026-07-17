export interface Weights {
  planHorizon: number;
  holdHorizon: number;
  buildRoiHorizon: number;
  minConquerProb: number;
  minHoldProb: number;
  reserveTroops: number;
  denialWeight: number;
  planStickiness: number;
  aggressionRamp: number;
  troopValue: number;
  coupValueFloor: number;
  peaceThreatFloor: number;
  tradeAcceptRatio: number;
  willAggressive: number;
  willNeutral: number;
  willDefensive: number;
}

export const WEIGHTS: Weights = {
  planHorizon: 8,
  holdHorizon: 6,
  buildRoiHorizon: 6,
  minConquerProb: 0.71,
  minHoldProb: 0.35,
  reserveTroops: 2,
  denialWeight: 0.7,
  planStickiness: 1.15,
  aggressionRamp: 0.003,
  troopValue: 1.3,
  coupValueFloor: 10,
  peaceThreatFloor: 0.35,
  tradeAcceptRatio: 1.05,
  willAggressive: 0.95,
  willNeutral: 0.5,
  willDefensive: 0.25,
};
