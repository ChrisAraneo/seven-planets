import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

export const getHomePlanet = (state: GameState, player: Player): Planet =>
  state.planets.find((planet) => planet.ownerId === player.id) ??
  state.planets[player.id];
