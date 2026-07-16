import { getTurn } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { computeHoldProbability } from './compute-hold-probability';
import { getOwnedPlanets } from './get-owned-planets';

export function computeDesiredGarrison(player: Player, planet: Planet): number {
  let desired = 4 + Math.min(11, Math.floor(getTurn() / 3));
  if (getOwnedPlanets(player).length === 1) {
    desired += 4;
  }
  if (planet.buildings.SILO) {
    desired += 4;
  }
  const risk = 1 - computeHoldProbability(player, planet, planet.troops);
  desired += Math.round(risk * 10);
  return desired;
}
