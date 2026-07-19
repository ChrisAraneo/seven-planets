import type { Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';

export const getOwnedPlanets = (player: Player): Planet[] =>
  getGameStateLastValue().planets.filter(
    (planet) => planet.ownerId === player.id,
  );
