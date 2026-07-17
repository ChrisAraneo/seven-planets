import type { Player } from '@seven-planets/game';
import { PACIFIST_INFLUENCE } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';

export const computeInfluenceIncome = (player: Player): number => {
  let income = 0;
  for (const planet of getOwnedPlanets(player)) {
    if ((planet.buildings.EMBASSY || 0) >= 2) {
      income += 1;
    }
    if (player.hasPacifistStatus) {
      income += PACIFIST_INFLUENCE;
    }
  }
  if (hasBuilding(player, 'EMBASSY')) {
    income += 0.25;
  }
  return income;
};
