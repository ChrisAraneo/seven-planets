import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

// TODO: Is it working properly?

export function ownedPlanets(state: GameState, player: Player): Planet[] {
  return player.planets.map((index) => state.planets[index]);
}
