import type { Planet, Player } from '@seven-planets/game';
import { getPlanets } from '@seven-planets/game';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { canTarget } from './can-target';
import { computePlanetValue } from './compute-planet-value';
import { getOwnedPlanets } from './get-owned-planets';
import { isUnderTruce } from './is-under-truce';

export const getBestCoupTarget = (
  player: Player,
): { planet: Planet; value: number } | null => {
  if (player.isKamikaze) {
    return null;
  }
  const canTakeLastPlanet = player.hasPacifistStatus;
  let best: { planet: Planet; value: number } | null = null;

  for (const candidatePlanet of getPlanets()) {
    const owner = getPlayerByIndex(candidatePlanet.ownerId);
    if (
      owner &&
      isViableCoupTarget(player, owner, candidatePlanet, canTakeLastPlanet)
    ) {
      const value =
        computePlanetValue(candidatePlanet) +
        (getOwnedPlanets(owner).length === 1 ? 10 : 0);
      if (!best || value > best.value) {
        best = { planet: candidatePlanet, value };
      }
    }
  }

  return best;
};

const isViableCoupTarget = (
  player: Player,
  owner: Player,
  planet: Planet,
  canTakeLastPlanet: boolean,
): boolean => {
  if (
    planet.ownerId === player.id ||
    !owner.isAlive ||
    isUnderTruce(planet) ||
    !canTarget(player, owner)
  ) {
    return false;
  }
  return canTakeLastPlanet || getOwnedPlanets(owner).length > 1;
};
