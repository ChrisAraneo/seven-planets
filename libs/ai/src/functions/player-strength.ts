import { BUILD_ORDER, BUILDINGS, handValue } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { owned } from './owned';
import { totalTroops } from './total-troops';

export function playerStrength(player: Player): number {
  const resources = handValue(player.hand);
  const military = totalTroops(player) * 1.5;
  const territory = owned(player).length * 8;
  const income = owned(player).reduce(
    (sum, planet) =>
      sum +
      BUILD_ORDER.filter(
        (buildingType) =>
          planet.buildings[buildingType] && BUILDINGS[buildingType].income,
      ).length *
        3,
    0,
  );
  return resources + military + territory + income;
}
