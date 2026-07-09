import { getTurn } from '@/stores/game/getters/get-turn';
import type { Planet, Player } from '@/game/types';

import { holdProbability } from './hold-probability';

export function desiredGarrison(p: Player, planet: Planet): number {
  let want = 4 + Math.min(11, Math.floor(getTurn() / 3));
  if (p.planets.length === 1) {
    want += 4;
  }
  if (planet.buildings.SILO) {
    want += 4;
  }
  const risk = 1 - holdProbability(p, planet, planet.troops);
  want += Math.round(risk * 10);
  return want;
}
