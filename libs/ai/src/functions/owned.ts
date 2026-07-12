import { getGameState } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

export function owned(player: Player): Planet[] {
  return getGameState().planets.filter(
    (planet) => planet.ownerId === player.id,
  );
}
