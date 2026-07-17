import type { Hand } from '../interfaces/hand';
import type { Planet } from '../interfaces/planet';
import { computeRecruitYield } from './compute-recruit-yield';

export function computeRecruitableTroops(planet: Planet, hand: Hand): number {
  return Math.min(
    computeRecruitYield(planet),
    (hand.ORE || 0) + (hand.RELIC || 0),
  );
}
