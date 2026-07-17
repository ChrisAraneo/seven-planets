import type { Player } from '@seven-planets/game';
import { BUILD_ORDER, BUILDINGS, computeHandValue } from '@seven-planets/game';

import { computeTotalTroops } from './compute-total-troops';
import { getOwnedPlanets } from './get-owned-planets';

export function computePlayerStrength(player: Player): number {
  const resources = computeHandValue(player.hand);
  const military = computeTotalTroops(player) * 1.5;
  const territory = getOwnedPlanets(player).length * 8;
  const income = getOwnedPlanets(player).reduce(
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
