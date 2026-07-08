import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function ownedPlanets(p: Player): Planet[] {
  const state = getGameState();
  return p.planets.map((id) => state.planets[id]);
}
