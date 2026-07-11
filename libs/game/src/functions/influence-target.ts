import type { GameState } from '../interfaces/game-state';
import type { InfluenceType } from '../interfaces/influence-type';
import type { Player } from '../interfaces/player';

import { filterAlivePlayers } from './filter-alive-players';
import { getTechLevel } from './get-tech-level';
import { ownedPlanets } from './owned-planets';
import { totalTroops } from './total-troops';

// Whom would this skip card hit? Always a RIVAL — the caster is never a target.
export function influenceTarget(
  state: GameState,
  p: Player,
  t: InfluenceType,
): Player | null {
  const rivals = filterAlivePlayers(state).filter((x) => x.id !== p.id);
  if (rivals.length === 0) {
    return null;
  }
  if (t === 'SKIP_ARMY') {
    return rivals.reduce((a, b) =>
      totalTroops(state, b) > totalTroops(state, a) ? b : a,
    );
  }
  if (t === 'SKIP_PLANETS') {
    return rivals.reduce((a, b) =>
      ownedPlanets(state, b).length > ownedPlanets(state, a).length ? b : a,
    );
  }
  if (t === 'SKIP_INFLUENCE') {
    return rivals.reduce((a, b) => (b.influence < a.influence ? b : a));
  }
  if (t === 'SKIP_TECH') {
    return rivals.reduce((a, b) =>
      getTechLevel(state, b) > getTechLevel(state, a) ? b : a,
    );
  }
  return null;
}
