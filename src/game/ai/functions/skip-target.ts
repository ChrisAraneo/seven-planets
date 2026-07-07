import type { GameState, InfluenceType, Player } from '@/game/types';
import { alive } from './alive';
import { techLevel } from './tech-level';
import { totalTroops } from './total-troops';

export function skipTarget(
  s: GameState,
  p: Player,
  t: InfluenceType,
): Player | null {
  const rivals = alive(s).filter((x) => x.id !== p.id);
  if (rivals.length === 0) {
    return null;
  }
  if (t === 'SKIP_ARMY') {
    return rivals.reduce((a, b) =>
      totalTroops(s, b) > totalTroops(s, a) ? b : a,
    );
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
    return rivals.reduce((a, b) => (techLevel(s, b) > techLevel(s, a) ? b : a));
  }
  return null;
}
