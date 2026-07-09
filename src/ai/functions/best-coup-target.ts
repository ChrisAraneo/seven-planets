import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { mayTarget } from './may-target';
import { planetValue } from './planet-value';
import { underTruce } from './under-truce';

export function bestCoupTarget(
  p: Player,
): { planet: Planet; value: number } | null {
  const s = getGameState();
  if (p.kamikaze) {
    return null;
  }
  const mayTakeLast = p.pacifistStatus;
  let best: { planet: Planet; value: number } | null = null;
  for (const pl of s.planets) {
    const owner = s.players[pl.ownerId];
    if (pl.ownerId === p.id || !owner.alive || underTruce(pl)) {
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
