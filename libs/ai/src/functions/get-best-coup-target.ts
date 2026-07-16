import { getPlanets } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { canTarget } from './can-target';
import { getOwnedPlanets } from './get-owned-planets';
import { computePlanetValue } from './compute-planet-value';
import { isUnderTruce } from './is-under-truce';
import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';

export function getBestCoupTarget(
  player: Player,
): { planet: Planet; value: number } | null {
  if (player.isKamikaze) {
    return null;
  }
  const canTakeLastPlanet = player.hasPacifistStatus;
  let best: { planet: Planet; value: number } | null = null;

  for (const candidatePlanet of getPlanets()) {
    const owner = getPlayerByIndex(candidatePlanet.ownerId);

    if (!owner) {
      continue;
    }

    if (
      candidatePlanet.ownerId === player.id ||
      !owner.isAlive ||
      isUnderTruce(candidatePlanet)
    ) {
      continue;
    }

    if (!canTarget(player, owner)) {
      continue;
    }

    if (!canTakeLastPlanet && getOwnedPlanets(owner).length === 1) {
      continue;
    }

    const value =
      computePlanetValue(candidatePlanet) +
      (getOwnedPlanets(owner).length === 1 ? 10 : 0);

    if (!best || value > best.value) {
      best = { planet: candidatePlanet, value };
    }
  }

  return best;
}
