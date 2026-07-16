import type { Player } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';

export function computeTotalTroops(player: Player): number {
  return getOwnedPlanets(player).reduce(
    (sum, planet) => sum + planet.troops,
    0,
  );
}
