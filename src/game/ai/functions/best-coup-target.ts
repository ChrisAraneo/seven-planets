import type { GameState, Planet, Player } from '@/game/types';
import { mayTarget } from './may-target';
import { planetValue } from './planet-value';
import { underTruce } from './under-truce';

export function bestCoupTarget(
  s: GameState,
  p: Player,
): { planet: Planet; value: number } | null {
  if (p.kamikaze) {
    return null;
  }
  const mayTakeLast = p.pacifistStatus;
  let best: { planet: Planet; value: number } | null = null;
  for (const pl of s.planets) {
    const owner = s.players[pl.ownerId];
    if (pl.ownerId === p.id || !owner.alive || underTruce(s, pl)) {
      continue;
    }
    if (!mayTarget(p, owner)) {
      continue;
    }
    if (!mayTakeLast && owner.planets.length === 1) {
      continue;
    }
    const value = planetValue(s, pl) + (owner.planets.length === 1 ? 10 : 0);
    if (!best || value > best.value) {
      best = { planet: pl, value };
    }
  }
  return best;
}
