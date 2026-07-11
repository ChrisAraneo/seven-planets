import { getGameState } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

export function owned(p: Player): Planet[] {
  return getGameState().planets.filter((pl) => pl.ownerId === p.id);
}
