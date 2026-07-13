import { getGameStateLastValue } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { mayTarget } from './may-target';
import { owned } from './owned';
import { planetValue } from './planet-value';
import { isUnderTruce } from './is-under-truce';

export function bestCoupTarget(
  player: Player,
): { planet: Planet; value: number } | null {
  if (player.isKamikaze) {
    return null;
  }
  const mayTakeLast = player.hasPacifistStatus;
  let best: { planet: Planet; value: number } | null = null;
  for (const eachPlanet of getGameStateLastValue().planets) {
    const owner = getGameStateLastValue().players[eachPlanet.ownerId];
    if (
      eachPlanet.ownerId === player.id ||
      !owner.isAlive ||
      isUnderTruce(eachPlanet)
    ) {
      continue;
    }
    if (!mayTarget(player, owner)) {
      continue;
    }
    if (!mayTakeLast && owned(owner).length === 1) {
      continue;
    }
    const value =
      planetValue(eachPlanet) + (owned(owner).length === 1 ? 10 : 0);
    if (!best || value > best.value) {
      best = { planet: eachPlanet, value };
    }
  }
  return best;
}
