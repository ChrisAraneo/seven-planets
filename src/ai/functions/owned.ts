import { getGameState } from '@/stores/game-state';
import type { Planet, Player } from '@/game/types';

export function owned(p: Player): Planet[] {
  return p.planets.map((id) => getGameState().planets[id]);
}
