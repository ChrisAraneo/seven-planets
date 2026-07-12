import { getTurn } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { holdProbability } from './hold-probability';
import { owned } from './owned';

export function desiredGarrison(player: Player, planet: Planet): number {
  let want = 4 + Math.min(11, Math.floor(getTurn() / 3));
  if (owned(player).length === 1) {
    want += 4;
  }
  if (planet.buildings.SILO) {
    want += 4;
  }
  const risk = 1 - holdProbability(player, planet, planet.troops);
  want += Math.round(risk * 10);
  return want;
}
