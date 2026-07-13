import { recruitYield } from './recruit-yield';
import type { Cost } from '../interfaces/cost';
import type { Planet } from '../interfaces/planet';

export function recruitCost(planet: Planet): Cost {
  return { ORE: recruitYield(planet) };
}
