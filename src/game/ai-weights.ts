/* =====================================================================
   SEVEN PLANETS — MASTERMIND AI weights.

   The mastermind AI (./ai.ts) derives its core math (battle odds, build
   costs, income values) directly from constants.ts, so most game-number
   changes propagate to it automatically. The judgment calls that CANNOT
   be derived — risk appetite, look-ahead windows, denial aggressiveness —
   live here.

   Recalibrate after changing game constants with:  npm run tune
   (the tuner rewrites this file with the best weights it finds).

   LAST TUNED: 2026-07-06T21:59:56.171Z by npm run tune
   ===================================================================== */

export interface AiWeights {
  /** Strategy look-ahead window in turns (the "next 5-10 turns" plan). */
  planHorizon: number
  /** Retention forecast window — will a conquest be retaken within this many turns? */
  holdHorizon: number
  /** A build must repay its cost within this many turns to be "worth it". */
  buildRoiHorizon: number
  /** Never launch a conquest below this win probability (relaxes late game). */
  minConquerProb: number
  /** ...nor when the retention forecast falls below this. */
  minHoldProb: number
  /** Defenders left at home when a strike launches. */
  reserveTroops: number
  /** How aggressively to hate-draft cards rivals want (0 = never deny). */
  denialWeight: number
  /** Multiplier protecting the current plan from turn-to-turn thrashing. */
  planStickiness: number
  /** Per-turn loosening of the conquest thresholds (endgame decisiveness). */
  aggressionRamp: number
  /** Strategic value of one troop when pricing expected battle losses. */
  troopValue: number
  /** Minimum planet value that justifies a 20-star Coup d'Etat. */
  coupValueFloor: number
  /** P(losing a planet this coming turn) that triggers a held Peace Treaty. */
  peaceThreatFloor: number
  /** Accept incoming trades when valueIn >= valueOut * this. */
  tradeAcceptRatio: number
  /** How likely an aggressive rival is to actually launch a viable attack. */
  willAggressive: number
  /** ...a neutral/unknown rival (balanced, random, the human player). */
  willNeutral: number
  /** ...a defensive rival (fortifier, economist, trader, ...). */
  willDefensive: number
}

export const AI_WEIGHTS: AiWeights = {
  planHorizon: 8,
  holdHorizon: 6,
  buildRoiHorizon: 14,
  minConquerProb: 0.63,
  minHoldProb: 0.35,
  reserveTroops: 2,
  denialWeight: 0.55,
  planStickiness: 1.15,
  aggressionRamp: 0.003,
  troopValue: 1.3,
  coupValueFloor: 10,
  peaceThreatFloor: 0.35,
  tradeAcceptRatio: 1.05,
  willAggressive: 0.85,
  willNeutral: 0.5,
  willDefensive: 0.25,
}
