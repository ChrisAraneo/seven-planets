import { getGameState } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { mayTarget } from './may-target';
import { planetValue } from './planet-value';
import { isUnderTruce } from './is-under-truce';

export function bestCoupTarget(
  p: Player,
): { planet: Planet; value: number } | null {
  if (p.kamikaze) {
    return null;
  }
  const mayTakeLast = p.pacifistStatus;
  let best: { planet: Planet; value: number } | null = null;
  for (const pl of getGameState().planets) {
    const owner = getGameState().players[pl.ownerId];
    if (pl.ownerId === p.id || !owner.alive || isUnderTruce(pl)) {
      continue;
    }
    if (!mayTarget(p, owner)) {
      continue;
    }
    if (!mayTakeLast && owner.planets.length === 1) {
      continue;
    }
    const value = planetValue(pl) + (owner.planets.length === 1 ? 10 : 0);
    if (!best || value > best.value) {
      best = { planet: pl, value };
    }
  }
  return best;
}
