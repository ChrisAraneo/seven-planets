import { getGameState } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

export function owned(p: Player): Planet[] {
  return p.planets.map((id) => getGameState().planets[id]);
}
