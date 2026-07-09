import { getGameState } from '@/stores/game-state';
import type { Planet, Player } from '@/game/types';

export function ownedPlanets(p: Player): Planet[] {
  return p.planets.map((id) => getGameState().planets[id]);
}
