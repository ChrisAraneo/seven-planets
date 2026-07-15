import { BUILD_ORDER, BUILDINGS, computeHandValue } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { owned } from './owned';
import { computeTotalTroops } from './compute-total-troops';

export function playerStrength(player: Player): number {
  const resources = computeHandValue(player.hand);
  const military = computeTotalTroops(player) * 1.5;
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
