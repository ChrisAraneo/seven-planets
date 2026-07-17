import type { Player } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';

export const computeTotalTroops = (player: Player): number =>
  getOwnedPlanets(player).reduce((sum, planet) => sum + planet.troops, 0);
