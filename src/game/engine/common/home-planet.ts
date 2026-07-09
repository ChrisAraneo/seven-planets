import { getGameState } from '@/stores/game-state';
import type { Planet, Player } from '@/game/types';

export function homePlanet(p: Player): Planet {
  return getGameState().planets[p.planets[0]];
}
