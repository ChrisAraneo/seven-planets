import { getGameStateLastValue } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

export function owned(player: Player): Planet[] {
  return getGameStateLastValue().planets.filter(
    (planet) => planet.ownerId === player.id,
  );
}
