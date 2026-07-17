import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

export const getOwnedPlanets = (state: GameState, player: Player): Planet[] =>
  state.planets.filter((planet) => planet.ownerId === player.id);
