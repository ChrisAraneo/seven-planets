import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function homePlanet(p: Player): Planet {
  const state = getGameState();
  return state.planets[p.planets[0]];
}
