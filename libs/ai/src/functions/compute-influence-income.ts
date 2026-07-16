import { PACIFIST_INFLUENCE } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { hasBuilding } from './has-building';
import { getOwnedPlanets } from './get-owned-planets';

export function computeInfluenceIncome(player: Player): number {
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
}
