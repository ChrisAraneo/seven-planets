import type { GameState, Planet, Player } from '@/game/types';
import { holdProbability } from './hold-probability';

export function desiredGarrison(
  s: GameState,
  p: Player,
  planet: Planet,
): number {
  let want = 4 + Math.min(11, Math.floor(s.turn / 3));
  if (p.planets.length === 1) {
    want += 4;
  }
  if (planet.buildings.SILO) {
    want += 4;
  }
  const risk = 1 - holdProbability(s, p, planet, planet.troops);
  want += Math.round(risk * 10);
  return want;
}
