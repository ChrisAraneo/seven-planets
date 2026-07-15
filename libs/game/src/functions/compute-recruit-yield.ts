import type { Planet } from '../interfaces/planet';

// Recruiting costs 1 Ore PER TROOP — yield depends on Barracks level.
// L1=1 troop, L2=2 troops, L3=4 troops (min(lvl,3), +1 once L3 is reached).
// Branch-free arithmetic: this sits in the AI's planning hot loop.
export function computeRecruitYield(planet: Planet): number {
  return (
    Math.min(planet.buildings.BARRACKS || 0, 3) +
    Number((planet.buildings.BARRACKS || 0) >= 3)
  );
}
