import type { Planet, Player } from '@/game/types';
import { aiMayTarget } from './ai-may-target';
import { coupTargets } from './coup-targets';
import { getState } from '../state';
import { isPacifist } from './is-pacifist';
import { persOf } from './pers-of';

// The juiciest planet a Coup could seize. Returns null when nothing is worth it.
export function aiPickCoupTarget(p: Player): Planet | null {
  if (p.kamikaze) {
    return null;
  } // A kamikaze hunts the human with rockets — never a Coup
  // A Coup is the pacifist's ONLY way to conquer, so it accepts weaker targets
  // And leans harder on eliminations to thin the field toward a full conquest.
  const pac = persOf(p) === 'pacifist' || isPacifist(p);
  let best: Planet | null = null;
  let bestScore = -Infinity;
  for (const pl of coupTargets(p)) {
    if (!aiMayTarget(p, getState().players[pl.ownerId])) {
      continue;
    } // Respect kamikaze targeting
    const bLevels = Object.values(pl.buildings).reduce((a, b) => a + b, 0);
    let score = bLevels + 2 * (pl.buildings.SINGULARITY || 0) + pl.troops * 0.5;
    if (getState().players[pl.ownerId].planets.length === 1) {
      score += pac ? 12 : 8;
    } // Elimination!
    if (score > bestScore) {
      bestScore = score;
      best = pl;
    }
  }
  return bestScore >= (pac ? 2 : 3) ? best : null;
}
