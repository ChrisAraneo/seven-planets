import type { InfluenceType, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { alive } from './alive';
import { techLevel } from './tech-level';
import { totalTroops } from './total-troops';

export function skipTarget(p: Player, t: InfluenceType): Player | null {
  const s = getGameState();
  const rivals = alive().filter((x) => x.id !== p.id);
  if (rivals.length === 0) {
    return null;
  }
  if (t === 'SKIP_ARMY') {
    return rivals.reduce((a, b) => (totalTroops(b) > totalTroops(a) ? b : a));
  }
  if (t === 'SKIP_PLANETS') {
    return rivals.reduce((a, b) =>
      b.planets.length > a.planets.length ? b : a,
    );
  }
  if (t === 'SKIP_INFLUENCE') {
    return rivals.reduce((a, b) => (b.influence < a.influence ? b : a));
  }
  if (t === 'SKIP_TECH') {
    return rivals.reduce((a, b) => (techLevel(b) > techLevel(a) ? b : a));
  }
  return null;
}
