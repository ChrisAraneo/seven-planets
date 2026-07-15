import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

export function getHomePlanet(state: GameState, player: Player): Planet {
  return (
    state.planets.find((planet) => planet.ownerId === player.id) ??
    state.planets[player.id]
  );
}
