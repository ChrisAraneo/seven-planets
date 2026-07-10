import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

export function homePlanet(state: GameState, p: Player): Planet {
  return state.planets[p.planets[0]];
}
