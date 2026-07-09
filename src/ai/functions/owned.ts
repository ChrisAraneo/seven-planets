import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function owned(p: Player): Planet[] {
  const s = getGameState();
  return p.planets.map((id) => s.planets[id]);
}
