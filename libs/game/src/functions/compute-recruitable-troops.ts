import type { Hand } from '../interfaces/hand';
import type { Planet } from '../interfaces/planet';

import { computeRecruitYield } from './compute-recruit-yield';

// How many troops a recruitment on `planet` actually yields given `hand`:
// the Barracks yield, capped by what the hand can pay at 1⛏️ per troop
// (RELIC wildcards stand in for missing Ore, as everywhere else).
export function computeRecruitableTroops(planet: Planet, hand: Hand): number {
  return Math.min(
    computeRecruitYield(planet),
    (hand.ORE || 0) + (hand.RELIC || 0),
  );
}
