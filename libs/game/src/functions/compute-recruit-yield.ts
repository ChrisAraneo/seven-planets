import type { Planet } from '../interfaces/planet';

// Recruiting costs 1 Ore PER TROOP — yield depends on Barracks level.
// L1=1 troop, L2=2 troops, L3=4 troops (min(lvl,3), +1 once L3 is reached).
// Branch-free arithmetic: this sits in the AI's planning hot loop.
// Yield caps at Barracks L3, which also grants the +1 bonus troop.
const BARRACKS_YIELD_CAP_LEVEL = 3;

export function computeRecruitYield(planet: Planet): number {
  return (
    Math.min(planet.buildings.BARRACKS || 0, BARRACKS_YIELD_CAP_LEVEL) +
    Number((planet.buildings.BARRACKS || 0) >= BARRACKS_YIELD_CAP_LEVEL)
  );
}
