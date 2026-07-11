import { getGameState } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { mayTarget } from './may-target';
import { owned } from './owned';
import { planetValue } from './planet-value';
import { isUnderTruce } from './is-under-truce';

export function bestCoupTarget(
  p: Player,
): { planet: Planet; value: number } | null {
  if (p.isKamikaze) {
    return null;
  }
  const mayTakeLast = p.hasPacifistStatus;
  let best: { planet: Planet; value: number } | null = null;
  for (const pl of getGameState().planets) {
    const owner = getGameState().players[pl.ownerId];
    if (pl.ownerId === p.id || !owner.isAlive || isUnderTruce(pl)) {
      continue;
    }
    if (!mayTarget(p, owner)) {
      continue;
    }
    if (!mayTakeLast && owned(owner).length === 1) {
      continue;
    }
    const value = planetValue(pl) + (owned(owner).length === 1 ? 10 : 0);
    if (!best || value > best.value) {
      best = { planet: pl, value };
    }
  }
  return best;
}
