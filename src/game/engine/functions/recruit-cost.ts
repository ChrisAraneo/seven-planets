import type { Cost, Planet } from '@/game/types';
import { recruitYield } from '@/game/shared/recruit-yield';

export function recruitCost(planet: Planet): Cost {
  return { ORE: recruitYield(planet) };
}
