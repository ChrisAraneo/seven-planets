// NOTE: This function is not used anywhere in the current codebase.
// It is only referenced by ai-pick-influence-play which is itself unused.
import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { aiMayTarget } from './ai-may-target';
import { coupTargets } from './coup-targets';
import { isPacifist } from './is-pacifist';

// The juiciest planet a Coup could seize. Returns null when nothing is worth it.
export function aiPickCoupTarget(p: Player): Planet | null {
  const state = getGameState();
  if (p.kamikaze) {
    return null;
  }
  const pac = isPacifist(p);
  let best: Planet | null = null;
  let bestScore = -Infinity;
  for (const pl of coupTargets(p)) {
    if (!aiMayTarget(p, state.players[pl.ownerId])) {
      continue;
    }
    const bLevels = Object.values(pl.buildings).reduce((a, b) => a + b, 0);
    let score = bLevels + 2 * (pl.buildings.SINGULARITY || 0) + pl.troops * 0.5;
    if (state.players[pl.ownerId].planets.length === 1) {
      score += pac ? 12 : 8;
    }
    if (score > bestScore) {
      bestScore = score;
      best = pl;
    }
  }
  return bestScore >= (pac ? 2 : 3) ? best : null;
}
