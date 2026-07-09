import { recruitYield } from '@/stores/game/functions/recruit-yield';
import type { Cost, Planet } from '@/game/types';

export function recruitCost(planet: Planet): Cost {
  return { ORE: recruitYield(planet) };
}
